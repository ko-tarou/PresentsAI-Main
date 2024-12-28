import React, { useState, useEffect } from "react";

export default function DataPage() {
	const [users, setUsers] = useState([]);

	// ユーザー一覧を取得する関数
	const fetchUsers = async () => {
		try {
			const response = await fetch("http://localhost:8080/users", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});
			if (response.ok) {
				const data = await response.json();
                console.log("Fetched users:", data);
				setUsers(data);
			} else {
				console.error("ユーザーの取得に失敗しました。");
			}
		} catch (error) {
			console.error("エラーが発生しました", error);
		}
	};

	// ユーザーを追加する関数
	const addUser = async () => {
		try {
			const userData = {
				name: "test",
				email: `test${Date.now()}@gmail.com`, // 一意のメールアドレスを生成
				password: "test",
			};

			const response = await fetch("http://localhost:8080/users", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(userData),
			});

			if (response.ok) {
				console.log("ユーザーを追加しました。");
				fetchUsers(); // リストを再取得
			} else {
				console.error("ユーザーの追加に失敗しました。");
			}
		} catch (error) {
			console.error("エラーが発生しました", error);
		}
	};

	// ユーザーを削除する関数
	const deleteUser = async (id) => {
        try {
            console.log(`Sending DELETE request for ID: ${id}`);
            const response = await fetch(`http://localhost:8080/users/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`エラー: 削除リクエスト失敗 - ${response.status}: ${errorText}`);
                return;
            }
    
            console.log(`ユーザー(ID: ${id})を削除しました。`);
            fetchUsers(); // リストを再取得
        } catch (error) {
            console.error("エラーが発生しました", error);
        }
    };
    
    

	// 初回読み込み時にユーザー一覧を取得
	useEffect(() => {
		fetchUsers();
	}, []);

	return (
		<div>
			<h1>データページ</h1>
			<p>ここはデータページです。</p>
			<button onClick={addUser}>ユーザーを追加</button>
			<h2>ユーザー一覧</h2>
			<ul>
				{users.map((user) => (
					<li key={user.ID}>
						{user.Name} ({user.Email}){" "}
						<button onClick={() => deleteUser(user.ID)}>削除</button>
					</li>
				))}
			</ul>
		</div>
	);
}
