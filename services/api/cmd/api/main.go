package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"

	appUser "github.com/ko-tarou/presentsai/services/api/internal/application/user"
	infraHTTP "github.com/ko-tarou/presentsai/services/api/internal/infrastructure/http"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/http/middleware"
	"github.com/ko-tarou/presentsai/services/api/internal/infrastructure/postgres"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
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

	// Services
	authService := appUser.NewAuthService(userRepo, refreshRepo)

	// Router
	r := mux.NewRouter()
	r.Use(middleware.CORS)
	r.Use(middleware.JSON)

	r.HandleFunc("/health", func(w http.ResponseWriter, req *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "presentsai-api"})
	}).Methods(http.MethodGet)

	// Auth routes (no auth required)
	authHandler := infraHTTP.NewAuthHandler(authService)
	authHandler.Register(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	_ = jwtSecret // will be used when adding protected routes in PR-004

	log.Printf("api service starting on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
