require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const os = require('os');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || "").trim());

// --- DATABASE SETUP ---
const USERS_FILE = 'users.json';
const SETTINGS_FILE = 'settings.json';
const DELETIONS_FILE = 'deletions.json'; 
const ADMIN_FILE = 'admin.json'; 

let adminSession = {};

// --- HELPER FUNCTIONS ---
function getUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUser(chatId) {
    const users = getUsers();
    if (!users.includes(chatId)) {
        users.push(chatId);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users));
    }
}

function getSettings() {
    if (!fs.existsSync(SETTINGS_FILE)) {
        const defaultSettings = {
            welcomeLinks: "👉 Group 1: [Link]\n👉 Group 2: [Link]"
        };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings));
    }
    return JSON.parse(fs.readFileSync(SETTINGS_FILE));
}

function saveSettings(settings) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings));
}

function getDeletions() {
    if (!fs.existsSync(DELETIONS_FILE)) {
        fs.writeFileSync(DELETIONS_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(DELETIONS_FILE));
}

// --- MULTI-ADMIN ID MANAGEMENT ---
function getAdmins() {
    if (fs.existsSync(ADMIN_FILE)) {
        const data = JSON.parse(fs.readFileSync(ADMIN_FILE));
        if (data.adminId && !data.admins) {
            data.admins = [data.adminId];
            fs.writeFileSync(ADMIN_FILE, JSON.stringify(data));
        }
        return data.admins || [];
    }
    return [];
}

function addAdminId(chatId) {
    const admins = getAdmins();
    const strId = String(chatId);
    if (!admins.includes(strId)) {
        admins.push(strId);
        fs.writeFileSync(ADMIN_FILE, JSON.stringify({ admins: admins }));
        return true;
    }
    return false;
}

// Auto-Delete Polling Loop (Runs every 1 minute)
setInterval(async () => {
    const deletions = getDeletions();
    if (deletions.length === 0) return;

    const now = Date.now();
    let remaining = [];

    for (const task of deletions) {
        if (now >= task.deleteAt) {
            try {
                await bot.deleteMessage(task.chatId, task.messageId);
            } catch (e) {}
        } else {
            remaining.push(task);
        }
    }

    if (deletions.length !== remaining.length) {
        fs.writeFileSync(DELETIONS_FILE, JSON.stringify(remaining));
    }
}, 60000);

function extractJSON(text) {
    try {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) return match[0];
        return text;
    } catch (e) {
        return text;
    }
}

// --- 100% LOCKED PDF MOCK TEST UI TEMPLATE ---
const UI_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF_DATE_TOPIC_HERE</title>
    <style>
        :root { --primary: #0d2149; --primary-light: #eff6ff; --success: #15803d; --success-light: #f0fdf4; --danger: #b91c1c; --danger-light: #fef2f2; --warning: #a16207; --warning-light: #fefce8; --info: #6b21a8; --info-light: #faf5ff; --dark: #1f2937; --gray-100: #f3f4f6; --gray-200: #e5e7eb; --gray-300: #d1d5db; --gray-600: #4b5563; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { height: 100vh; overflow: hidden; background-color: var(--gray-100); color: #000000; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-card { background: white; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3); overflow: hidden; }
        .modal-header { background: var(--primary); color: white; padding: 20px; text-align: center; }
        .modal-header h2 { font-size: 1.5rem; margin-bottom: 5px; }
        .modal-body { padding: 24px; }
        .quote-box { background: var(--primary-light); border-left: 4px solid var(--primary); padding: 14px; border-radius: 4px; color: var(--primary); font-weight: 500; margin-bottom: 16px; font-size: 0.95rem; line-height: 1.5; }
        .marking-box { background: var(--gray-100); border-left: 4px solid var(--dark); padding: 12px; border-radius: 4px; color: var(--dark); margin-bottom: 20px; font-size: 0.9rem; font-weight: 600; }
        .start-btn { width: 100%; background: var(--primary); color: white; border: none; padding: 14px; border-radius: 6px; font-weight: bold; font-size: 1.1rem; cursor: pointer; transition: 0.2s; }
        .start-btn:hover { background: #0a1936; }
        .app-container { display: none; flex-direction: column; height: 100vh; }
        
        header { background-color: var(--primary); color: white; border-bottom: none; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; height: auto; min-height: 60px; flex-wrap: wrap; }
        .logo-section h1 { font-size: 1.25rem; color: white; font-weight: bold; }
        .header-actions { display: flex; align-items: center; gap: 15px; }
        .timer-strip { display: flex; align-items: center; gap: 10px; }
        .timer { font-size: 1.1rem; font-weight: bold; color: white; background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); }
        
        .workspace { display: flex; flex: 1; height: calc(100vh - 60px); overflow: hidden; }
        .question-column { flex: 1; display: flex; flex-direction: column; height: 100%; background: white; position: relative; }
        .question-header { padding: 16px 24px; border-bottom: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center; }
        .question-number { font-weight: bold; font-size: 1.1rem; color: var(--primary); }
        .question-category { font-size: 0.8rem; background: var(--primary-light); color: var(--primary); padding: 4px 8px; border-radius: 4px; font-weight: 600; }
        .question-content { flex: 1; overflow-y: auto; padding: 24px; padding-bottom: 80px; }
        .question-text { font-size: 1.15rem; line-height: 1.6; margin-bottom: 24px; font-weight: 600; color: #000000; }
        .options-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .option-item { border: 1px solid var(--gray-300); border-radius: 8px; padding: 14px 18px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-weight: 500; color: #111111; }
        .option-item.selected { background: var(--primary-light); border-color: var(--primary); }
        .option-item input { width: 18px; height: 18px; accent-color: var(--primary); }
        .explanation-box { display: none; margin-top: 24px; padding: 18px; background: var(--primary-light); border-left: 4px solid var(--primary); border-radius: 4px; font-size: 0.95rem; line-height: 1.5; color: #000000; }
        .option-item.correct { background: var(--success-light) !important; border-color: var(--success) !important; color: var(--success); font-weight: 700; }
        .option-item.incorrect { background: var(--danger-light) !important; border-color: var(--danger) !important; color: var(--danger); font-weight: 700; }
        .action-bar { position: absolute; bottom: 0; left: 0; width: 100%; background: white; padding: 16px 24px; border-top: 1px solid var(--gray-200); display: flex; justify-content: space-between; align-items: center; z-index: 10; }
        .btn { padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid transparent; font-size: 0.95rem; }
        .btn-outline { border-color: var(--gray-300); background: white; color: var(--dark); }
        .btn-primary { background: var(--primary); color: white; }
        .btn-success { background: var(--success); color: white; }
        .btn-warning { background: var(--warning); color: white; }
        
        .sidebar-column { width: 340px; border-left: 1px solid var(--gray-200); display: flex; flex-direction: column; background: white; height: 100%; }
        .palette-header { padding: 15px 16px; font-weight: 700; font-size: 0.95rem; color: var(--primary); background: white; border-bottom: 1px solid var(--gray-200); text-transform: uppercase; }
        
        .legend-container { padding: 15px 16px; border-bottom: 1px solid var(--gray-200); font-size: 0.8rem; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; font-weight: 500; }
        .legend-item { display: flex; align-items: center; gap: 8px; }
        .legend-dot { width: 14px; height: 14px; border-radius: 50%; }
        .legend-dot.unvisited { background: var(--gray-100); border-color: var(--gray-300); border: 1px solid var(--gray-300); }
        .legend-dot.skipped { background: var(--danger); }
        .legend-dot.attempted { background: var(--success); }
        .legend-dot.marked { background: var(--info); }

        .palette-container { flex: 1; overflow-y: auto; padding: 20px 16px; }
        
        .palette-grid { display: grid; grid-template-columns: repeat(5, 42px); justify-content: center; gap: 12px; }
        .palette-item { height: 42px; width: 42px; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 700; border-radius: 50%; cursor: pointer; border: 1px solid var(--gray-300); background: var(--gray-100); color: #111; transition: transform 0.1s; }
        .palette-item.active { box-shadow: 0 0 0 3px #93c5fd, 0 0 0 1px var(--primary); }
        .palette-item.unvisited { background: var(--gray-100); border-color: var(--gray-300); color: var(--dark); }
        .palette-item.skipped { background: var(--danger); border-color: var(--danger); color: white; }
        .palette-item.attempted { background: var(--success); border-color: var(--success); color: white; }
        .palette-item.marked { background: var(--info); border-color: var(--info); color: white; }
        
        .palette-item.ans-correct { background: var(--success) !important; border-color: var(--success) !important; color: white !important; }
        .palette-item.ans-wrong { background: var(--danger) !important; border-color: var(--danger) !important; color: white !important; }
        .palette-item.ans-skipped { background: var(--gray-100) !important; border-color: var(--gray-300) !important; color: var(--dark) !important; }

        .mobile-toggle { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: white; }
        .sidebar-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
        .sidebar-modal-content { background: white; width: 300px; height: 100%; float: right; display: flex; flex-direction: column; }
        
        .solution-view-container { display: none; flex: 1; height: calc(100vh - 60px); overflow-y: auto; background: var(--gray-100); padding: 30px 20px; }
        .analytics-panel { max-width: 900px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 30px; }
        .score-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .score-card { background: #f8fafc; border: 1px solid var(--border-color); border-radius: 6px; padding: 25px 20px; text-align: center; }
        .score-card h3 { font-size: 0.9rem; color: #64748b; margin-bottom: 10px; letter-spacing: 0.5px; }
        .score-card .val { font-size: 2.2rem; font-weight: 800; }
        
        @media (max-width: 768px) {
            header { flex-direction: column; align-items: flex-start; padding: 10px; }
            .header-actions { width: 100%; justify-content: space-between; margin-top: 10px; }
            .timer-strip { width: 100%; display: flex; justify-content: center; margin-top: 10px; padding: 5px 0; border-top: 1px solid rgba(255,255,255,0.2); }
            .workspace { flex-direction: column; height: calc(100vh - 100px); }
            .sidebar-column { display: none; }
            .mobile-toggle { display: block; }
            .action-bar { position: fixed; bottom: 0; left: 0; padding: 10px; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); justify-content: center; gap: 5px; flex-wrap: wrap; }
            .btn { flex: 1; padding: 8px; font-size: 0.8rem; min-width: 30%; text-align: center; }
            .score-row { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="modal-overlay" id="startModal">
        <div class="modal-card">
            <div class="modal-header">
                <h2>PDF_DATE_TOPIC_HERE</h2>
            </div>
            <div class="modal-body">
                <div class="quote-box">
                    <strong>🎯 All the Best for your Banking Exams!</strong><br><br>
                    If you find this premium mock test helpful, please share our group as much as possible and support us. Your support motivates our team to work even harder for your success!
                </div>
                <div class="marking-box">⏱️ Total Time: 25 Minutes<br>✅ Correct: +1 Mark | ❌ Incorrect: -0.25 Marks</div>
                <button class="start-btn" id="startQuizBtn">Start Quiz</button>
            </div>
        </div>
    </div>

    <div class="app-container" id="appContainer">
        <header>
            <div class="logo-section">
                <h1>PDF_DATE_TOPIC_HERE</h1>
            </div>
            <div class="header-actions">
                <div class="timer-strip">
                    <div class="timer" id="timerBox">⏱️ <span id="timerDisplay">25:00</span></div>
                </div>
                <button class="mobile-toggle" id="mobileMenuToggle">⋮</button>
            </div>
        </header>

        <div class="workspace" id="testWorkspace">
            <div class="question-column">
                <div class="question-header">
                    <span class="question-number" id="questionNumberLabel">Question 1 of 50</span>
                    <span class="question-category" id="questionCategoryLabel">Loading...</span>
                </div>
                <div class="question-content">
                    <div class="question-text" id="questionTextDisplay">Loading question...</div>
                    <ul class="options-list" id="optionsContainer"></ul>
                    <div class="explanation-box" id="explanationDisplay"></div>
                </div>
                <div class="action-bar">
                    <button class="btn btn-outline" id="prevBtn" disabled>Previous</button>
                    <button class="btn btn-warning" id="markReviewBtn">Mark for Review</button>
                    <button class="btn btn-outline" id="clearBtn">Clear</button>
                    <button class="btn btn-primary" id="saveNextBtn">Save & Next</button>
                </div>
            </div>

            <div class="sidebar-column" id="desktopSidebar">
                <div class="palette-header">Question Palette</div>
                <div class="legend-container" id="paletteLegend">
                    <div class="legend-item"><div class="legend-dot unvisited"></div><span>Not Visited</span></div>
                    <div class="legend-item"><div class="legend-dot skipped"></div><span>Not Answered</span></div>
                    <div class="legend-item"><div class="legend-dot attempted"></div><span>Answered</span></div>
                    <div class="legend-item"><div class="legend-dot marked"></div><span>Marked</span></div>
                </div>
                <div class="palette-container">
                    <div class="palette-grid" id="paletteGrid"></div>
                </div>
                <div style="padding: 16px; border-top: 1px solid var(--gray-200); background: white;" id="sidebarSubmitContainer">
                    <button class="btn btn-success" id="sidebarSubmitBtn" style="width: 100%; padding: 14px; font-size: 1.1rem;">Submit Test</button>
                </div>
            </div>
        </div>

        <div class="solution-view-container" id="solutionsWorkspace">
            <div class="analytics-panel">
                <div style="text-align:center; margin-bottom: 25px;">
                    <h2 style="color: var(--primary); font-size: 1.8rem;">Performance Analysis Dashboard</h2>
                </div>
                <div class="score-row">
                    <div class="score-card" style="border-top: 4px solid var(--primary);">
                        <h3>FINAL SCORE</h3>
                        <div class="val" id="scoreDisplay" style="color: var(--primary);">0 / 50</div>
                    </div>
                    <div class="score-card" style="border-top: 4px solid #10b981;">
                        <h3>ACCURACY</h3>
                        <div class="val" id="accuracyDisplay" style="color: #10b981;">0%</div>
                    </div>
                    <div class="score-card" style="border-top: 4px solid #3b82f6;">
                        <h3>CORRECT / WRONG</h3>
                        <div class="val" id="attemptsDisplay" style="color: #3b82f6;">0 / 0</div>
                    </div>
                </div>
                <button class="btn btn-primary" id="startReviewModeBtn" style="width:100%; padding:15px; font-size:1.1rem;">View Detailed Solutions</button>
            </div>
        </div>
    </div>

    <div class="sidebar-modal" id="mobileSidebarModal">
        <div class="sidebar-modal-content" id="mobileSidebarContent"></div>
    </div>

    <script>
        const questions = /* AI_INSERT_50_QUESTIONS_HERE_IN_JSON_FORMAT */;

        let userAnswers = Array(50).fill(null);
        let questionStatuses = Array(50).fill("unvisited");
        let currentIdx = 0;
        let testTimer = null;
        let remainingSeconds = 25 * 60; // 25 minutes
        let isSubmitted = false;
        let isTestRunning = false;

        const startModal = document.getElementById("startModal");
        const startQuizBtn = document.getElementById("startQuizBtn");
        const appContainer = document.getElementById("appContainer");
        const timerDisplay = document.getElementById("timerDisplay");
        const testWorkspace = document.getElementById("testWorkspace");
        const solutionsWorkspace = document.getElementById("solutionsWorkspace");
        const questionNumberLabel = document.getElementById("questionNumberLabel");
        const questionCategoryLabel = document.getElementById("questionCategoryLabel");
        const questionTextDisplay = document.getElementById("questionTextDisplay");
        const optionsContainer = document.getElementById("optionsContainer");
        const explanationDisplay = document.getElementById("explanationDisplay");
        const prevBtn = document.getElementById("prevBtn");
        const saveNextBtn = document.getElementById("saveNextBtn");
        const markReviewBtn = document.getElementById("markReviewBtn");
        const clearBtn = document.getElementById("clearBtn");
        const sidebarSubmitContainer = document.getElementById("sidebarSubmitContainer");
        const sidebarSubmitBtn = document.getElementById("sidebarSubmitBtn");
        const startReviewModeBtn = document.getElementById("startReviewModeBtn");
        const paletteGrid = document.getElementById("paletteGrid");
        const desktopSidebar = document.getElementById("desktopSidebar");
        const mobileMenuToggle = document.getElementById("mobileMenuToggle");
        const mobileSidebarModal = document.getElementById("mobileSidebarModal");
        const mobileSidebarContent = document.getElementById("mobileSidebarContent");

        window.addEventListener("load", () => buildPalette(paletteGrid));

        startQuizBtn.addEventListener("click", () => {
            if (window.innerWidth > 768) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log("Fullscreen blocked or not supported", err);
                });
            }
            
            startModal.style.display = "none";
            appContainer.style.display = "flex";
            isTestRunning = true;
            startTimer();
            loadQuestion(0);
        });

        document.addEventListener("fullscreenchange", () => {
            if (isTestRunning && !isSubmitted && !document.fullscreenElement && window.innerWidth > 768) {
                alert("⚠️ SECURITY VIOLATION: You exited Full Screen mode!\\n\\nTo prevent cheating, your test has been automatically submitted.");
                submitExam();
            }
        });

        function buildPalette(container) {
            container.innerHTML = "";
            for (let i = 0; i < 50; i++) {
                const item = document.createElement("div");
                item.className = "palette-item unvisited";
                item.innerText = i + 1;
                item.addEventListener("click", () => { loadQuestion(i); mobileSidebarModal.style.display="none"; });
                container.appendChild(item);
            }
        }

        function updatePaletteUI() {
            const grids = [paletteGrid, mobileSidebarContent.querySelector("#paletteGrid")];
            grids.forEach(grid => {
                if(grid) {
                    const items = grid.querySelectorAll(".palette-item");
                    items.forEach((item, index) => {
                        item.className = "palette-item " + questionStatuses[index];
                        if (index === currentIdx) item.classList.add("active");
                    });
                }
            });
        }

        function loadQuestion(index) {
            if (questionStatuses[currentIdx] === "unvisited") questionStatuses[currentIdx] = "skipped";
            currentIdx = index;
            const q = questions[index];
            if(!q) return;

            questionNumberLabel.innerText = "Question " + (index + 1) + " of 50";
            questionCategoryLabel.innerText = q.category || "General";
            
            questionTextDisplay.innerText = q.question;
            optionsContainer.innerHTML = "";

            const safeOptions = Array.isArray(q.options) && q.options.length > 0 
                ? q.options 
                : ["Option A (Data missing)", "Option B (Data missing)", "Option C (Data missing)", "Option D (Data missing)"];

            safeOptions.forEach((optText, optIdx) => {
                const li = document.createElement("li");
                li.className = "option-item";
                if (userAnswers[index] === optIdx) li.classList.add("selected");
                if (isSubmitted) {
                    if (optIdx === q.correct) li.classList.add("correct");
                    else if (userAnswers[index] === optIdx) li.classList.add("incorrect");
                }
                li.innerHTML = "<input type='radio' " + (userAnswers[index] === optIdx ? "checked" : "") + " " + (isSubmitted ? "disabled" : "") + "> <label style='cursor:pointer; width:100%;'>" + optText + "</label>";
                if (!isSubmitted) li.addEventListener("click", () => selectOption(optIdx));
                optionsContainer.appendChild(li);
            });

            if (isSubmitted) {
                explanationDisplay.innerHTML = "<strong>Detailed Explanation:</strong><br><br>" + (q.explanation || "No explanation provided.");
                explanationDisplay.style.display = "block";
                markReviewBtn.style.display = "none";
                clearBtn.style.display = "none";
            } else {
                explanationDisplay.style.display = "none";
                markReviewBtn.style.display = "inline-block";
                clearBtn.style.display = "inline-block";
            }

            prevBtn.disabled = index === 0;
            if (index === 49) {
                saveNextBtn.innerText = isSubmitted ? "Exit Solutions" : "Submit Test";
                saveNextBtn.className = "btn btn-success";
            } else {
                saveNextBtn.innerText = "Save & Next";
                saveNextBtn.className = "btn btn-primary";
            }

            if (!isSubmitted && questionStatuses[index] === "unvisited") questionStatuses[index] = "skipped";
            updatePaletteUI();
            
            document.querySelector('.question-content').scrollTop = 0;
        }

        function selectOption(optIdx) {
            userAnswers[currentIdx] = optIdx;
            questionStatuses[currentIdx] = "attempted";
            loadQuestion(currentIdx);
        }

        prevBtn.addEventListener("click", () => currentIdx > 0 && loadQuestion(currentIdx - 1));
        saveNextBtn.addEventListener("click", () => {
            if (currentIdx < 49) loadQuestion(currentIdx + 1);
            else if (!isSubmitted) confirmSubmit();
            else window.location.reload(); 
        });
        markReviewBtn.addEventListener("click", () => {
            if (!isSubmitted) { questionStatuses[currentIdx] = "marked"; if (currentIdx < 49) loadQuestion(currentIdx + 1); else updatePaletteUI(); }
        });
        clearBtn.addEventListener("click", () => {
            if (!isSubmitted) { userAnswers[currentIdx] = null; questionStatuses[currentIdx] = "skipped"; loadQuestion(currentIdx); }
        });
        sidebarSubmitBtn.addEventListener("click", () => confirmSubmit());

        function confirmSubmit() { if (confirm("Are you sure you want to submit the exam?")) submitExam(); }

        function submitExam() {
            isSubmitted = true;
            isTestRunning = false;
            clearInterval(testTimer);
            document.getElementById("timerBox").style.display = "none";
            
            if (sidebarSubmitContainer) {
                sidebarSubmitContainer.style.display = "none";
            }

            let correctCount = 0, wrongCount = 0;
            
            questions.forEach((q, idx) => {
                if (userAnswers[idx] !== null) {
                    if (userAnswers[idx] === q.correct) {
                        correctCount++;
                        questionStatuses[idx] = "ans-correct"; 
                    } else {
                        wrongCount++;
                        questionStatuses[idx] = "ans-wrong"; 
                    }
                } else {
                    questionStatuses[idx] = "ans-skipped"; 
                }
            });

            document.querySelectorAll('.legend-container').forEach(el => {
                el.innerHTML = \`
                    <div class="legend-item"><div class="legend-dot" style="background:var(--success);"></div><span>Correct</span></div>
                    <div class="legend-item"><div class="legend-dot" style="background:var(--danger);"></div><span>Wrong</span></div>
                    <div class="legend-item"><div class="legend-dot" style="background:var(--gray-100); border: 1px solid var(--gray-300);"></div><span>Unattempted</span></div>
                \`;
            });
            updatePaletteUI();

            const finalScore = (correctCount * 1) - (wrongCount * 0.25);
            const totalAtt = correctCount + wrongCount;
            const accuracy = totalAtt > 0 ? Math.round((correctCount / totalAtt) * 100) : 0;

            document.getElementById("scoreDisplay").innerText = finalScore.toFixed(2) + " / 50";
            document.getElementById("accuracyDisplay").innerText = accuracy + "%";
            document.getElementById("attemptsDisplay").innerText = correctCount + " / " + wrongCount;

            testWorkspace.style.display = "none";
            solutionsWorkspace.style.display = "flex";
        }

        startReviewModeBtn.addEventListener("click", () => {
            solutionsWorkspace.style.display = "none";
            testWorkspace.style.display = "flex";
            loadQuestion(0);
        });

        function startTimer() {
            testTimer = setInterval(() => {
                remainingSeconds--;
                if (remainingSeconds <= 0) { clearInterval(testTimer); alert("Time is up!"); submitExam(); } 
                else {
                    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
                    const s = (remainingSeconds % 60).toString().padStart(2, '0');
                    timerDisplay.innerText = m + ":" + s;
                }
            }, 1000);
        }

        mobileMenuToggle.addEventListener("click", () => {
            mobileSidebarContent.innerHTML = desktopSidebar.innerHTML;
            const mobGrid = mobileSidebarContent.querySelector("#paletteGrid");
            if(mobGrid) {
                const items = mobGrid.querySelectorAll(".palette-item");
                items.forEach((item, idx) => item.addEventListener("click", () => { loadQuestion(idx); mobileSidebarModal.style.display="none"; }));
            }
            
            const mobSubmitContainer = mobileSidebarContent.querySelector("#sidebarSubmitContainer");
            if(mobSubmitContainer) {
                if(isSubmitted) {
                    mobSubmitContainer.style.display = "none";
                } else {
                    const mobSubmitBtn = mobSubmitContainer.querySelector("#sidebarSubmitBtn");
                    if (mobSubmitBtn) mobSubmitBtn.addEventListener("click", () => confirmSubmit());
                }
            }

            mobileSidebarModal.style.display = "block";
        });

        mobileSidebarModal.addEventListener("click", (e) => { if (e.target === mobileSidebarModal) mobileSidebarModal.style.display = "none"; });
    </script>
</body>
</html>`;

// --- BOT EVENT HANDLERS ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || msg.caption || '';
    const strChatId = String(chatId);
    
    const admins = getAdmins();
    const isAdmin = admins.includes(strChatId);

    saveUser(chatId);

    // 0. MAGIC COMMAND TO BECOME ADMIN
    if (text === '/claimadmin') {
        const added = addAdminId(chatId);
        if (added) {
            return bot.sendMessage(chatId, "✅ **ADMIN ACCESS GRANTED!**\nTumhari ID admin list mein permanently lock ho gayi hai. Ab tum commands aur replies use kar sakte ho.");
        } else {
            return bot.sendMessage(chatId, "✅ **ALREADY ADMIN:** Tumhara account pehle se hi Admin panel mein registered hai.");
        }
    }

    // --- ADMIN WIZARD: SET LINKS ---
    if (adminSession[chatId] && isAdmin && adminSession[chatId].flow === 'SETLINKS' && !text.startsWith('/')) {
        const session = adminSession[chatId];
        
        if (session.step === 'WAITING_FOR_COUNT') {
            const count = parseInt(text.trim());
            if (isNaN(count) || count <= 0 || count > 10) {
                return bot.sendMessage(chatId, "⚠️ Please enter a valid number (between 1 and 10).");
            }
            
            let template = "";
            for (let i = 1; i <= count; i++) {
                template += `Link ${i}: \n`;
            }
            
            adminSession[chatId].step = 'WAITING_FOR_LINKS';
            return bot.sendMessage(chatId, `Great! You want to set ${count} links.\n\nPlease COPY the text below, paste your links next to them, and send it back to me:\n\n${template}`);
        }
        
        if (session.step === 'WAITING_FOR_LINKS') {
            const lines = text.split('\n');
            let formattedLinks = "";
            let groupNum = 1;
            
            for (let line of lines) {
                if (line.toLowerCase().includes('link')) {
                    const parts = line.split(':');
                    if (parts.length > 1) {
                        const url = parts.slice(1).join(':').trim();
                        if (url) {
                            formattedLinks += `👉 Group ${groupNum}: ${url}\n`;
                            groupNum++;
                        }
                    }
                }
            }
            
            if (!formattedLinks) {
                return bot.sendMessage(chatId, "⚠️ No links detected. Please copy the template, add the links, and try again.");
            }
            
            const settings = getSettings();
            settings.welcomeLinks = formattedLinks.trim();
            saveSettings(settings);
            
            delete adminSession[chatId]; 
            return bot.sendMessage(chatId, `✅ Free group links have been successfully updated!\n\nPreview:\n${formattedLinks.trim()}`);
        }
    }

    // --- ADMIN WIZARD: BROADCAST WITH AUTO-DELETE ---
    if (adminSession[chatId] && isAdmin && adminSession[chatId].flow === 'BROADCAST' && !text.startsWith('/')) {
        const session = adminSession[chatId];
        
        if (session.step === 'WAITING_FOR_MSG') {
            adminSession[chatId].broadcastMsg = text;
            adminSession[chatId].step = 'WAITING_FOR_TIME';
            return bot.sendMessage(chatId, "⏳ **How long should this message stay live?**\n\nPlease enter the duration in HOURS (e.g., send '2' for two hours, '24' for one day). Enter '0' to keep it permanently.");
        }

        if (session.step === 'WAITING_FOR_TIME') {
            const hours = parseFloat(text.trim());
            if (isNaN(hours) || hours < 0) {
                return bot.sendMessage(chatId, "⚠️ Invalid input. Please send a valid number for hours (e.g., 2) or 0 for permanent.");
            }

            const msgToBroadcast = adminSession[chatId].broadcastMsg;
            delete adminSession[chatId]; 

            const users = getUsers();
            bot.sendMessage(chatId, `🚀 Starting broadcast to ${users.length} users...`);

            let successCount = 0;
            const deleteAt = hours > 0 ? Date.now() + (hours * 60 * 60 * 1000) : null;
            let newDeletions = [];

            for (const id of users) {
                try {
                    const sentMsg = await bot.sendMessage(id, msgToBroadcast);
                    successCount++;
                    if (deleteAt) {
                        newDeletions.push({ chatId: id, messageId: sentMsg.message_id, deleteAt: deleteAt });
                    }
                } catch(e) {}
            }

            if (newDeletions.length > 0) {
                const allDeletions = getDeletions();
                fs.writeFileSync(DELETIONS_FILE, JSON.stringify(allDeletions.concat(newDeletions)));
            }

            let confirmMsg = `✅ Broadcast complete! Delivered to ${successCount} users.`;
            if (hours > 0) confirmMsg += `\n🗑️ These messages will automatically delete in ${hours} hours.`;
            else confirmMsg += `\n📌 These messages are permanent.`;

            return bot.sendMessage(chatId, confirmMsg);
        }
    }

    // 1. COMMAND TRIGGER: /setlinks (Admin Only)
    if (text === '/setlinks') {
        if (!isAdmin) {
            return bot.sendMessage(chatId, "⚠️ Access Denied: You are not authorized to use this command.");
        }
        adminSession[chatId] = { flow: 'SETLINKS', step: 'WAITING_FOR_COUNT' };
        return bot.sendMessage(chatId, "⚙️ **Link Manager:**\nHow many links do you want to set? (Send a number between 1 and 10)");
    }

    // 2. COMMAND TRIGGER: /broadcast (Admin Only)
    if (text === '/broadcast') {
        if (!isAdmin) {
            return bot.sendMessage(chatId, "⚠️ Access Denied: You are not authorized to use this command.");
        }
        adminSession[chatId] = { flow: 'BROADCAST', step: 'WAITING_FOR_MSG' };
        return bot.sendMessage(chatId, "📢 **Broadcast System:**\nPlease send the message you want to broadcast to all students.");
    }

    // 3. ADMIN NATIVE REPLY SYSTEM (Fixed: Text & Media Extraction Using Clear Format)
    if (isAdmin && msg.reply_to_message) {
        const originalText = msg.reply_to_message.text || msg.reply_to_message.caption || '';
        const match = originalText.match(/Student-ID:\s*(\d+)/i); 
        
        if (match && match[1]) {
            const studentId = match[1];
            try {
                if (msg.photo || msg.voice || msg.sticker || msg.video || msg.document) {
                    await bot.sendMessage(studentId, `👨‍🏫 **Admin Reply:**`, { parse_mode: 'Markdown' });
                    await bot.copyMessage(studentId, chatId, msg.message_id);
                } else {
                    await bot.sendMessage(studentId, `👨‍🏫 **Admin Reply:**\n\n${text}`, { parse_mode: 'Markdown' });
                }
                return bot.sendMessage(chatId, "✅ Reply successfully sent to the student.");
            } catch(e) {
                return bot.sendMessage(chatId, `❌ Failed to send: ${e.message}`);
            }
        } else {
            return bot.sendMessage(chatId, "⚠️ Unable to find Student-ID in the message you replied to.");
        }
    }

    // 4. STUDENT DM ROUTING -> TO ALL ADMINS (Fixed Formatting for Seamless Identification)
    if (!isAdmin && !text.startsWith('/')) {
        if (msg.document && (!msg.caption || !msg.caption.toLowerCase().includes('/quiz'))) return;

        if (!msg.document) {
            const headerText = `📩 **New Message**\nFrom: ${msg.chat.first_name || 'User'}\nStudent-ID: ${chatId}`;
            
            for (const adId of admins) {
                try {
                    if (msg.photo || msg.voice || msg.video || msg.audio || msg.document) {
                        await bot.copyMessage(adId, chatId, msg.message_id, {
                            caption: `${headerText}\n\n${msg.caption || ''}`
                        });
                    } else if (msg.sticker) {
                        await bot.sendMessage(adId, `${headerText}\n\n[Sent a Sticker 👇]`);
                        await bot.copyMessage(adId, chatId, msg.message_id);
                    } else if (text) {
                        await bot.sendMessage(adId, `${headerText}\n\n${text}`);
                    }
                } catch (err) {
                    console.log("Routing error:", err.message);
                }
            }
        }
        return;
    }

    // 5. COMMAND: /start
    if (text === '/start') {
        const settings = getSettings();
        let welcomeMsg = `🌟 **Welcome to our Premium Exam Bot!** 🌟\n\nFirst, make sure to join our free Telegram groups so you never miss out on study materials and exam updates:\n\n${settings.welcomeLinks}\n\n🎓 **Need a Premium Batch or Have Doubts?**\nSimply type your query here and drop a message. Our team will get back to you directly via this bot!`;
        
        if (isAdmin) {
            welcomeMsg += `\n\n🛡️ **ADMIN PANEL (Only visible to you):**\n📄 PDF to Quiz: Send PDF with \`/quiz\` caption\n📢 Broadcast: \`/broadcast\`\n🔗 Update Links: \`/setlinks\``;
        }

        return bot.sendMessage(chatId, welcomeMsg, { parse_mode: "Markdown" });
    }

    // 6. PDF HANDLER (Strict /quiz trigger)
    if (msg.document && msg.document.mime_type === 'application/pdf') {
        const caption = msg.caption ? msg.caption.toLowerCase().trim() : "";
        
        if (caption !== '/quiz') {
            return; 
        }

        try {
            bot.sendMessage(chatId, "📄 PDF Received. 🚀\nPhase 1: Extracting exactly 50 English questions sequentially...");

            const originalFileName = msg.document.file_name || "Mock_Test.pdf";
            const baseName = originalFileName.replace(/\.[^/.]+$/, "");
            const englishFileName = `${baseName}_English.html`;
            const hindiFileName = `${baseName}_Hindi.html`;

            const fileId = msg.document.file_id;
            const fileLink = await bot.getFileLink(fileId);

            const response = await fetch(fileLink);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const pdfBase64 = buffer.toString('base64');

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const extractPrompt = `You are a strict JSON data extractor. Read the PDF sequentially from page 1 to the end. Extract exactly 50 core factual questions (25 direct, 25 deep/statement-based).
            
            CRITICAL RULES: 
            1. Output ONLY a valid JSON array of objects. Do not write any HTML or markdown (\`\`\`json).
            2. EVERY single question object MUST contain the "options" key with an array of EXACTLY 4 strings. DO NOT skip the options array for any question.
            3. The "explanation" field MUST be highly detailed (3 to 5 sentences long). You MUST include deep background context, related static facts, and explicitly state why the correct option is the right answer. Do not give short one-line answers.
            
            Format required:
            [
              {
                "id": 1,
                "category": "Topic Name",
                "question": "Question text here?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct": 0,
                "explanation": "Detailed paragraph explanation here with context and facts."
              }
            ]`;

            const resultEn = await model.generateContent([
                extractPrompt,
                { inlineData: { data: pdfBase64, mimeType: "application/pdf" } }
            ]);

            const englishJsonStr = extractJSON(resultEn.response.text());

            bot.sendMessage(chatId, "✅ Phase 2: English questions extracted successfully! Now translating strictly to Hindi...");

            const translatePrompt = `You are an expert translator. Translate the following JSON array of 50 English questions into Hindi. 
            CRITICAL RULES:
            1. Keep the EXACT same JSON structure, array length, and keys ("id", "category", "question", "options", "correct", "explanation").
            2. DO NOT delete, skip, or rename any keys. The "options" array MUST remain intact with exactly 4 strings for every question.
            3. ONLY translate the string values into natural, exam-standard Hindi. The "explanation" must remain highly detailed in Hindi. Do not change the value of "correct" or "id".
            4. Output ONLY a valid JSON array. Do not wrap in markdown (no \`\`\`json).
            
            Source JSON:
            ${englishJsonStr}`;

            const resultHi = await model.generateContent(translatePrompt);
            const hindiJsonStr = extractJSON(resultHi.response.text());

            bot.sendMessage(chatId, "⚙️ Phase 3: Translation complete. Generating final locked UI templates...");

            const englishHtml = UI_TEMPLATE
                .replace('/* AI_INSERT_50_QUESTIONS_HERE_IN_JSON_FORMAT */', englishJsonStr)
                .replace(/PDF_DATE_TOPIC_HERE/g, `${baseName} - English`);

            const hindiHtml = UI_TEMPLATE
                .replace('/* AI_INSERT_50_QUESTIONS_HERE_IN_JSON_FORMAT */', hindiJsonStr)
                .replace(/PDF_DATE_TOPIC_HERE/g, `${baseName} - Hindi`);

            const enPath = path.join(os.tmpdir(), englishFileName);
            fs.writeFileSync(enPath, englishHtml);
            await bot.sendDocument(chatId, enPath, { caption: "📘 English Version Ready! (Proctored Mode Active)" });
            fs.unlinkSync(enPath);

            const hiPath = path.join(os.tmpdir(), hindiFileName);
            fs.writeFileSync(hiPath, hindiHtml);
            await bot.sendDocument(chatId, hiPath, { caption: "📙 Hindi Version Ready! (Proctored Mode Active)" });
            fs.unlinkSync(hiPath);

        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "⚠️ Oops! The AI servers are currently facing high traffic (Error 503). Please try sending the PDF again after 2 minutes.");
        }
    }
});

const express = require('express');
const app = express();
app.get('/', (req, res) => res.send("Bot Server is running flawlessly. Ecosystem Active!"));
app.listen(process.env.PORT || 10000);
