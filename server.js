const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const tasksFile = path.join(__dirname, 'tasks.json');
let tasks = [];

// Load tasks from file on startup
function loadTasks() {
  if (fs.existsSync(tasksFile)) {
    const data = fs.readFileSync(tasksFile, 'utf8');
    tasks = JSON.parse(data || '[]');
  }
}

// Save tasks to file
function saveTasks() {
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
}

loadTasks();

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/' && req.method === 'GET') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (pathname === '/tasks' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tasks));
  } else if (pathname === '/tasks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const task = JSON.parse(body);
      task.id = Date.now();
      task.completed = false;
      task.createdAt = new Date().toISOString();
      tasks.push(task);
      saveTasks();
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(task));
    });
  } else if (pathname.match(/^\/tasks\/\d+$/) && req.method === 'DELETE') {
    const id = parseInt(pathname.split('/')[2]);
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else if (pathname.match(/^\/tasks\/\d+$/) && req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const id = parseInt(pathname.split('/')[2]);
      const update = JSON.parse(body);
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.text = update.text || task.text;
        task.category = update.category || task.category;
        saveTasks();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(task));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Task not found' }));
      }
    });
  } else if (pathname.match(/^\/tasks\/\d+\/toggle$/) && req.method === 'PATCH') {
    const id = parseInt(pathname.split('/')[2]);
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(task));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Task not found' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
