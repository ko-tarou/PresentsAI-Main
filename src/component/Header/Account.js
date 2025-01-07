import { useState } from "react";
import styles from "../../styles/HeaderPage/Account.module.scss";

export default function AccountModal() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false); // フォーム切り替え用の状態

  // フォームデータの変更を管理
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // サインアップ処理
  const handleSignup = async () => {
    try {
    const response = await fetch("http://localhost:8080/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      setMessage("Account created successfully!");
      setForm({ name: "", email: "", password: "" });
    } else {
      const data = await response.json();
      setMessage(`Error: ${data.message || "Failed to create account"}`);
    }
    } catch (error) {
    setMessage(`Error: ${error.message}`);
    }
  };

  // ログイン処理
  const handleLogin = async () => {
    try {
    const response = await fetch("http://localhost:8080/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      email: form.email,
      password: form.password,
      }),
    });

    if (response.ok) {
      setMessage("Logged in successfully!");
      setIsLoggedIn(true);
    } else {
      const data = await response.json();
      setMessage(`Error: ${data.message || "Login failed"}`);
    }
    } catch (error) {
    setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.title}>
        {isSignup ? "Create Account" : "Login"}
      </div>

      {!isLoggedIn ? (
      <>
        {/* サインアップフォーム */}
        {isSignup && (
          <div className={styles.form}>
            <div className={styles.input}>
              <div className={styles.label}>
                User Name
              </div>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className={styles.input}>
              <div className={styles.label}>
                Mail
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className={styles.input}>
              <div className={styles.label}>
                Password
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <div className={styles.main_button}>
              <button onClick={handleSignup}>Create</button>
            </div>
            <div className={styles.sub_button}>
              <button onClick={() => setIsSignup(false)}>go to Login</button>
            </div>
          </div>
        )}

        {/* ログインフォーム */}
        {!isSignup && (
          <div className={styles.form}>
            <div className={styles.input}>
              <div className={styles.label}>
                Email
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className={styles.input}>
              <div className={styles.label}>
                Password
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <div className={styles.main_button}>
              <button onClick={handleLogin}>Login</button>
            </div>
            <div className={styles.sub_button}>
              <button onClick={() => setIsSignup(true)}>go to Create Account</button>
            </div>
          </div>
        )}
        </>
      ) : (
        <p>Welcome back! You are logged in.</p>
      )}

      {/* <p>{message}</p> */}
    </div>
  );
}
