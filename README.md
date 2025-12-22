# Sample Test Archiver

As a successor of *Mathtoolkit Repository*, this website resembles most mechanics from old archive, additionally brings in interactive, yet intuitive interface that non-technical users can quickly navigate appropriate materials by using filters and keywords.

---

## ⚠️ IMPORTANT NOTE:

Starting from **December 2025**, all previous tests will be moved to **Google Drive storage**, subsequently terminate the obsolete repository in **Q1/2026**.

---

## 🚀 INSTALLATION & USAGE:

### For non-technical users

Please refer to the website below

[sample-test-archiver.up.railway.app](https://sample-test-archiver.up.railway.app)

---

### For developers, scientists 

This part is intended for those who want to make out references and learn our work

## 📦 Prerequisites: 
- Visual Studio Code
- NodeJS
- MySQL Workspace (MySQL software)

## 🛠️ Setup Procedures
1. Download the source code from "local" branch.
2. Extract the file and run the project from VSCode (Open Project).
3. Before running the project, create the required database by executing the following line:
```
db/create_tables_2.sql
```
4. Open the terminal and install the necessary dependencies:
```
npm install
npm install express-session
```
5. Modifying the database configuration with your current host name and password:
```
server/utils/db.js
```
6. Once everything is satisfied, typing the command:
```
node server/server.js
```
7. Now it will pop up the local host link to your project website, press **Ctrl + Left Click** on the link and enjoy.
8. To stop the server, click on the terminal and press **Ctrl + C**.
