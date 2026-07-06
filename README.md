# CodeAlpha_ProjectManagementTool

A Trello/Asana-style collaborative project management tool built as part of the **CodeAlpha Full Stack Development Internship** (Task 3).

## ✨ Features

- **Auth** — JWT-based registration & login
- **Projects** — create collaborative project boards, add members by username
- **Tasks** — create, edit, delete tasks; assign to team members; set due dates
- **Kanban Board** — 3 columns (To Do / In Progress / Done) with drag-and-drop **and** quick move arrows
- **Comments** — comment on any task
- **Notifications** — get notified when assigned a task, someone comments, or you're added to a project
- **Custom UI** — polished modals and toast notifications (no native browser alerts)

## 🛠 Tech Stack

**Frontend:** HTML, CSS, JavaScript (vanilla)
**Backend:** Node.js, Express.js
**Database:** MongoDB (Mongoose)
**Auth:** JWT (jsonwebtoken), bcrypt for password hashing

## 📁 Project Structure

```
task-management-app/
├── config/          # Database connection
├── middleware/      # Auth middleware
├── models/          # Mongoose schemas (User, Project, Task, TaskComment, Notification)
├── routes/          # Express routes (auth, projects, tasks, notifications)
├── public/          # Frontend (HTML, CSS, JS)
├── server.js        # App entry point
└── .env.example     # Environment variable template
```

## 🚀 Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/<your-username>/CodeAlpha_ProjectManagementTool.git
   cd CodeAlpha_ProjectManagementTool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy `.env.example`) and add your own values:
   ```
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

4. Run the server:
   ```bash
   node server.js
   ```

5. Open `http://localhost:5001` in your browser.


## 👩‍💻 Author

Built by Tamara Chaeib as part of the CodeAlpha Full Stack Development Internship.

## 📜 License

This project was built for educational purposes as part of the CodeAlpha internship program.
