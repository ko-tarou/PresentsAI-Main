package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"

	appPresentation "github.com/ko-tarou/presentsai/services/api/internal/application/presentation"
	appSlide "github.com/ko-tarou/presentsai/services/api/internal/application/slide"
	appUser "github.com/ko-tarou/presentsai/services/api/internal/application/user"
	infraHTTP "github.com/ko-tarou/presentsai/services/api/internal/infrastructure/http"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/http/middleware"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/postgres"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	refreshSecret := os.Getenv("JWT_REFRESH_SECRET")
	if jwtSecret == "" || refreshSecret == "" {
		log.Fatal("JWT_SECRET and JWT_REFRESH_SECRET must be set")
	}

	db, err := postgres.Connect()
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	if err := postgres.Migrate(db); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	// Repositories
	userRepo := postgres.NewUserRepository(db)
	refreshRepo := postgres.NewRefreshTokenRepository(db)
	presentationRepo := postgres.NewPresentationRepository(db)
	slideRepo := postgres.NewSlideRepository(db)

	// Use cases
	authService := appUser.NewAuthService(userRepo, refreshRepo)
	presentationUC := appPresentation.NewUseCase(presentationRepo, slideRepo)
	slideUC := appSlide.NewUseCase(slideRepo, presentationRepo)

	// Handlers
	authHandler := infraHTTP.NewAuthHandler(authService)
	presentationHandler := infraHTTP.NewPresentationHandler(presentationUC)
	slideHandler := infraHTTP.NewSlideHandler(slideUC)
	commentHandler := infraHTTP.NewCommentHandler(db)

	r := mux.NewRouter()
	r.Use(middleware.CORS)
	r.Use(middleware.JSON)

	r.HandleFunc("/health", func(w http.ResponseWriter, req *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "presentsai-api"})
	}).Methods(http.MethodGet)

	// Public auth routes
	r.HandleFunc("/auth/register", authHandler.HandleRegister).Methods(http.MethodPost)
	r.HandleFunc("/auth/login", authHandler.HandleLogin).Methods(http.MethodPost)
	r.HandleFunc("/auth/refresh", authHandler.HandleRefresh).Methods(http.MethodPost)

	// Protected routes
	protected := r.PathPrefix("").Subrouter()
	protected.Use(middleware.Auth(jwtSecret))

	protected.HandleFunc("/auth/logout", authHandler.HandleLogout).Methods(http.MethodPost)

	// Presentations
	protected.HandleFunc("/presentations", presentationHandler.HandleList).Methods(http.MethodGet)
	protected.HandleFunc("/presentations", presentationHandler.HandleCreate).Methods(http.MethodPost)
	protected.HandleFunc("/presentations/{id}", presentationHandler.HandleGet).Methods(http.MethodGet)
	protected.HandleFunc("/presentations/{id}", presentationHandler.HandleUpdate).Methods(http.MethodPut)
	protected.HandleFunc("/presentations/{id}", presentationHandler.HandleDelete).Methods(http.MethodDelete)

	// Comments
	protected.HandleFunc("/presentations/{id}/comments", commentHandler.HandleList).Methods(http.MethodGet)
	protected.HandleFunc("/presentations/{id}/comments", commentHandler.HandleCreate).Methods(http.MethodPost)

	// Slides
	protected.HandleFunc("/presentations/{id}/slides", slideHandler.HandleList).Methods(http.MethodGet)
	protected.HandleFunc("/presentations/{id}/slides", slideHandler.HandleCreate).Methods(http.MethodPost)
	protected.HandleFunc("/presentations/{id}/slides/reorder", slideHandler.HandleReorder).Methods(http.MethodPut)
	protected.HandleFunc("/presentations/{id}/slides/{slideId}", slideHandler.HandleGet).Methods(http.MethodGet)
	protected.HandleFunc("/presentations/{id}/slides/{slideId}", slideHandler.HandleUpdate).Methods(http.MethodPut)
	protected.HandleFunc("/presentations/{id}/slides/{slideId}", slideHandler.HandleDelete).Methods(http.MethodDelete)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{Addr: ":" + port, Handler: r}

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
		<-quit
		log.Println("Shutting down server...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("Server forced to shutdown: %v", err)
		}
	}()

	log.Printf("api service starting on :%s", port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
	log.Println("Server stopped")
}
