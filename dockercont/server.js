
const express = require("express");

const app = express();
const PORT = 5000;

// Middleware to read JSON data
app.use(express.json());

// Temporary in-memory database
let tasks = [
    { id: 1, title: "Learn Node.js", completed: false },
    { id: 2, title: "Learn Docker", completed: true }
];

//prometheus
const client = require("prom-client");
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const requestCounter = new client.Counter({
 name: "crud_http_requests_total",
 help: "Total HTTP requests received by the CRUD API",
 labelNames: ["method", "route", "status_code"],
 registers: [register]
});
const requestDuration = new client.Histogram({
 name: "crud_http_request_duration_seconds",
 help: "HTTP request duration in seconds",
 labelNames: ["method", "route"],
 buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
 registers: [register]
});
// Register this middleware before the CRUD routes.
app.use((req, res, next) => {
 const start = process.hrtime.bigint();
 res.on("finish", () => {
 const route = req.route?.path || req.path;
 requestCounter.labels(
 req.method, route, String(res.statusCode)
 ).inc();
 const seconds =
 Number(process.hrtime.bigint() - start) / 1e9;
 requestDuration.labels(req.method, route).observe(seconds);
 });
 next();
});
// Prometheus scrape endpoint
app.get("/metrics", async (req, res) => {
 res.set("Content-Type", register.contentType);
 res.end(await register.metrics());
});
//



// 1. CREATE - POST
app.post("/tasks", (req, res) => {
    const newTask = {
        id: tasks.length > 0
            ? Math.max(...tasks.map(task => task.id)) + 1
            : 1,
        title: req.body.title,
        completed: req.body.completed ?? false
    };

    if (!newTask.title) {
        return res.status(400).json({
            message: "Task title is required"
        });
    }

    tasks.push(newTask);

    res.status(201).json({
        message: "Task created successfully",
        task: newTask
    });
});

// 2. READ - GET ALL TASKS
app.get("/tasks", (req, res) => {
    res.status(200).json(tasks);
});

app.get("/", (req, res) => {
    res.json({
        message: "CRUD Backend Application",
        version: "v2"
    });
});

// READ - GET TASK BY ID
app.get("/tasks/:id", (req, res) => {
    const id = Number(req.params.id);

    const task = tasks.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    res.json(task);
});

// 3. UPDATE - PUT
app.put("/tasks/:id", (req, res) => {
    const id = Number(req.params.id);

    const task = tasks.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    if (!req.body.title) {
        return res.status(400).json({
            message: "Task title is required"
        });
    }

    task.title = req.body.title;
    task.completed = req.body.completed ?? false;

    res.json({
        message: "Task updated successfully",
        task: task
    });
});

// PARTIAL UPDATE - PATCH
app.patch("/tasks/:id", (req, res) => {
    const id = Number(req.params.id);

    const task = tasks.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    if (req.body.title !== undefined) {
        task.title = req.body.title;
    }

    if (req.body.completed !== undefined) {
        task.completed = req.body.completed;
    }

    res.json({
        message: "Task partially updated",
        task: task
    });
});

// 4. DELETE
app.delete("/tasks/:id", (req, res) => {
    const id = Number(req.params.id);

    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    tasks.splice(index, 1);

    res.json({
        message: "Task deleted successfully"
    });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
 console.log(JSON.stringify({
 level: "info",
 message: "server_started",
 port: PORT,
 timestamp: new Date().toISOString()
 }));
});
