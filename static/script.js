document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages-container");
    const clearChatBtn = document.getElementById("clear-chat-btn");
    const faqList = document.getElementById("faq-list-container");
    const faqSearch = document.getElementById("faq-search");
    const searchClearBtn = document.getElementById("search-clear-btn");
    const initialSuggestions = document.getElementById("initial-suggestions");
    
    // Analytics DOM Elements
    const noMetricsMsg = document.getElementById("no-metrics-msg");
    const metricsDetails = document.getElementById("metrics-details");
    const metricScore = document.getElementById("metric-score");
    const metricMatchStatus = document.getElementById("metric-match-status");
    const metricProgressBar = document.getElementById("metric-progress-bar");
    const metricTokens = document.getElementById("metric-tokens");
    const metricRankingList = document.getElementById("metric-ranking-list");

    // Local state for FAQs
    let allFAQs = [];

    // Initialize application
    init();

    async function init() {
        await loadFAQDirectory();
        setupEventListeners();
        renderInitialSuggestions();
    }

    // Set up event handlers
    function setupEventListeners() {
        chatForm.addEventListener("submit", handleChatSubmit);
        clearChatBtn.addEventListener("click", clearChat);
        faqSearch.addEventListener("input", handleSearch);
        searchClearBtn.addEventListener("click", clearSearch);
    }

    // Load FAQ database from backend
    async function loadFAQDirectory() {
        try {
            const response = await fetch("/api/faqs");
            if (!response.ok) throw new Error("Failed to load FAQs");
            
            allFAQs = await response.json();
            renderFAQList(allFAQs);
        } catch (error) {
            console.error("Error loading FAQs:", error);
            faqList.innerHTML = `
                <div class="loader-spinner" style="color: var(--accent-red)">
                    <i class="fa-solid fa-triangle-exclamation"></i> Error loading FAQ database.
                </div>
            `;
        }
    }

    // Group FAQs by category and render them
    function renderFAQList(faqs) {
        if (faqs.length === 0) {
            faqList.innerHTML = `<div class="loader-spinner">No matching FAQs found.</div>`;
            return;
        }

        // Group by category
        const categories = {};
        faqs.forEach(faq => {
            if (!categories[faq.category]) {
                categories[faq.category] = [];
            }
            categories[faq.category].push(faq);
        });

        let html = "";
        for (const [category, items] of Object.entries(categories)) {
            html += `
                <div class="faq-category-group">
                    <div class="category-title">${category}</div>
                    ${items.map(item => `
                        <div class="faq-item-card" data-question="${item.question.replace(/"/g, '&quot;')}">
                            <i class="fa-solid fa-chevron-right"></i>
                            <span>${item.question}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        faqList.innerHTML = html;

        // Add click events to FAQ cards
        document.querySelectorAll(".faq-item-card").forEach(card => {
            card.addEventListener("click", () => {
                const question = card.getAttribute("data-question");
                submitUserQuestion(question);
            });
        });
    }

    // Show initial quick action chips in welcome message
    function renderInitialSuggestions() {
        const defaultSuggestions = [
            "What is Antigravity IDE?",
            "What slash commands are available?",
            "How do I add rules?"
        ];
        
        initialSuggestions.innerHTML = defaultSuggestions.map(q => `
            <button class="chip-btn" data-question="${q.replace(/"/g, '&quot;')}">
                <i class="fa-solid fa-sparkles"></i> ${q}
            </button>
        `).join('');

        initialSuggestions.querySelectorAll(".chip-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const question = btn.getAttribute("data-question");
                submitUserQuestion(question);
            });
        });
    }

    // Clear chat display
    function clearChat() {
        chatMessages.innerHTML = `
            <div class="message bot-message message-appear">
                <div class="msg-avatar"><i class="fa-robot fa-solid"></i></div>
                <div class="msg-content">
                    <p>Chat history cleared. I'm ready for new questions about Antigravity IDE!</p>
                </div>
            </div>
        `;
        resetAnalyticsDashboard();
    }

    // Handle Form Submit
    function handleChatSubmit(e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;
        
        submitUserQuestion(text);
        chatInput.value = "";
    }

    // Send a question (either typed or clicked)
    function submitUserQuestion(question) {
        // Render User Message
        appendMessage("user", question);
        
        // Render Typing Indicator
        const typingIndicatorId = appendTypingIndicator();
        
        // Auto-scroll chat window
        scrollToBottom();

        // Fetch from API
        fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: question })
        })
        .then(res => {
            if (!res.ok) throw new Error("Network response error");
            return res.json();
        })
        .then(data => {
            // Remove Typing Indicator
            removeTypingIndicator(typingIndicatorId);

            // Simulate slight AI typing delay for polished feel
            setTimeout(() => {
                appendMessage("bot", data.answer, data.suggestions || []);
                updateAnalyticsDashboard(data);
                scrollToBottom();
            }, 450);
        })
        .catch(err => {
            console.error("API error:", err);
            removeTypingIndicator(typingIndicatorId);
            appendMessage("bot", "Oops! I encountered an error communicating with the NLP server. Please ensure the backend is running properly.");
            scrollToBottom();
        });
    }

    // Append standard message to log
    function appendMessage(sender, text, suggestions = []) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", `${sender}-message`, "message-appear");
        
        const avatarHtml = sender === "bot" 
            ? `<div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>`
            : `<div class="msg-avatar"><i class="fa-solid fa-user"></i></div>`;
            
        // Convert line breaks to paragraphs and code tags
        const formattedText = formatMessageText(text);

        messageDiv.innerHTML = `
            ${avatarHtml}
            <div class="msg-content">
                ${formattedText}
            </div>
        `;
        chatMessages.appendChild(messageDiv);

        // Render suggestion chips below the bot message if any
        if (sender === "bot" && suggestions.length > 0) {
            const chipsDiv = document.createElement("div");
            chipsDiv.classList.add("suggestions-container", "message-appear");
            chipsDiv.innerHTML = suggestions.map(s => `
                <button class="chip-btn" data-question="${s.replace(/"/g, '&quot;')}">
                    <i class="fa-solid fa-arrow-right-long"></i> ${s}
                </button>
            `).join('');
            
            chatMessages.appendChild(chipsDiv);

            // Bind click to chips
            chipsDiv.querySelectorAll(".chip-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    submitUserQuestion(btn.getAttribute("data-question"));
                });
            });
        }
        
        scrollToBottom();
    }

    // Helper to add formatting to text (simple markdown/code parsing)
    function formatMessageText(text) {
        if (!text) return "";
        
        // Escape HTML to prevent injection
        let escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Parse code blocks ```code```
        escaped = escaped.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        });

        // Parse inline code `code`
        escaped = escaped.replace(/`([^`\n]+)`/g, "<code>$1</code>");

        // Convert lists starting with - or *
        const lines = escaped.split("\n");
        let inList = false;
        let result = [];
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                if (!inList) {
                    result.push("<ul>");
                    inList = true;
                }
                result.push(`<li>${trimmed.substring(2)}</li>`);
            } else {
                if (inList) {
                    result.push("</ul>");
                    inList = false;
                }
                if (trimmed) {
                    result.push(`<p>${line}</p>`);
                } else {
                    result.push("<div style='height: 8px;'></div>");
                }
            }
        });
        
        if (inList) {
            result.push("</ul>");
        }

        return result.join("");
    }

    // Render Typing status animation
    function appendTypingIndicator() {
        const id = "typing-" + Date.now();
        const indicatorDiv = document.createElement("div");
        indicatorDiv.id = id;
        indicatorDiv.classList.add("message", "bot-message", "message-appear");
        
        indicatorDiv.innerHTML = `
            <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="msg-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        chatMessages.appendChild(indicatorDiv);
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Sidebar search and filter FAQs
    function handleSearch(e) {
        const val = e.target.value.toLowerCase().trim();
        
        if (val) {
            searchClearBtn.style.display = "block";
            // Filter all FAQs locally based on question, tags, or category
            const filtered = allFAQs.filter(faq => {
                const matchQ = faq.question.toLowerCase().includes(val);
                const matchCat = faq.category.toLowerCase().includes(val);
                const matchTags = faq.tags.some(t => t.toLowerCase().includes(val));
                return matchQ || matchCat || matchTags;
            });
            renderFAQList(filtered);
        } else {
            searchClearBtn.style.display = "none";
            renderFAQList(allFAQs);
        }
    }

    function clearSearch() {
        faqSearch.value = "";
        searchClearBtn.style.display = "none";
        renderFAQList(allFAQs);
        faqSearch.focus();
    }

    // Reset analytics display
    function resetAnalyticsDashboard() {
        noMetricsMsg.style.display = "flex";
        metricsDetails.style.display = "none";
    }

    // Update real-time NLP details in the right dashboard panel
    function updateAnalyticsDashboard(data) {
        noMetricsMsg.style.display = "none";
        metricsDetails.style.display = "block";

        // Score value and status pill
        const score = data.score || 0;
        metricScore.textContent = score.toFixed(4);
        
        if (data.matched) {
            metricMatchStatus.textContent = "Matched";
            metricMatchStatus.className = "similarity-pill match-success";
        } else {
            metricMatchStatus.textContent = "Low Match";
            metricMatchStatus.className = "similarity-pill match-fail";
        }

        // Set progress bar fill (width matches similarity score percentage)
        const pct = Math.max(0, Math.min(100, score * 100));
        metricProgressBar.style.width = `${pct}%`;

        // Render processed lemmas/tokens
        const lemmas = data.query_lemmas || [];
        if (lemmas.length === 0) {
            metricTokens.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted)">None (empty or stopwords only)</span>`;
        } else {
            metricTokens.innerHTML = lemmas.map(l => `
                <span class="token-tag">${l}</span>
            `).join('');
        }

        // Render rankings list (top 5 document matches)
        const rankings = data.all_scores || [];
        if (rankings.length === 0) {
            metricRankingList.innerHTML = `<li style="font-size:0.75rem; color:var(--text-muted)">No evaluations conducted.</li>`;
        } else {
            metricRankingList.innerHTML = rankings.map((rank, idx) => `
                <li class="match-ranking-item">
                    <div class="ranking-meta">
                        <span class="ranking-index">#${idx + 1}</span>
                        <span class="ranking-score">${rank.score.toFixed(4)}</span>
                    </div>
                    <div class="ranking-question" title="${rank.question.replace(/"/g, '&quot;')}">
                        ${rank.question}
                    </div>
                </li>
            `).join('');
        }
    }
});
