import { useState } from "react";

export default function AccountModal() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    <div>
      <h2>Account Information</h2>

      {!isLoggedIn ? (
        <>
          <div>
            <h3>Sign Up</h3>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
            <button onClick={handleSignup}>Sign Up</button>
          </div>

          <div>
            <h3>Login</h3>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
            <button onClick={handleLogin}>Login</button>
          </div>
        </>
      ) : (
        <p>Welcome back! You are logged in.</p>
      )}

      <p>{message}</p>
    </div>
  );
}
