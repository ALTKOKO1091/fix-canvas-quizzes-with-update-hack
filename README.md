# Fix Canvas Quizzes with Update Hack

This tool uses puppeteer to go into quizzes and "edit" every question, though it doesn't actually change anything. This will prevent the quiz from throwing a 500 error with the API.

## How to Install
Standard Install

1. Clone this repository:
    ```bash
    git clone https://github.com/byuitechops/fix-canvas-quizzes-with-update-hack.git
    ```
1. Step into the folder that was just created 
    ```bash
    cd ./fix-canvas-quizzes-with-update-hack
    ```
1. To install dependancies, run:
    ```bash
    npm i
    ```

## How to Use
Run the following command:
```bash
node main
```
The program will prompt you for the course ID and your username and password for Canvas.
