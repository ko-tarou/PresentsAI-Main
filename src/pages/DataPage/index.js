import {} from "react"

export default function DataPage() {

    const addUser = async () => {

        try {
            const userData = {
				name: "test",
				email: "test@gmail.com",
                password: "test",
            }

            const response = await fetch("http://localhost:8080/users",{
                method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
                body: JSON.stringify(userData),
            })

            if(response.ok){
                console.log("ユーザーを追加しました。")
			}else{
				console.log("ユーザーの追加に失敗しました。")
			}
		} catch (error) {
			console.error("エラーが発生しました", error)
		}
    }

	return (
		<div>
			<h1>データページ</h1>
			<p>ここはデータページです。</p>
            <button onClick={addUser}>ユーザーを追加</button>
		</div>
	);
}