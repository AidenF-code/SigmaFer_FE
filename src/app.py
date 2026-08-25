from src import create_app

app = create_app("development")


if __name__ == '__main__':
    print("Starting the application...")
    app.run(debug=True, port=5001)