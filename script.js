const searchInput = document.getElementById("input");
const submitBtn = document.getElementById("submit-btn");
const loadingEl = document.getElementById("loading");
const noResults = document.getElementById("no-results");

const avatar = document.getElementById("avatar");
const profileName = document.getElementById("name");
const dateEl = document.getElementById("date");
const userEl = document.getElementById("user");
const bioEl = document.getElementById("bio");
const pageEl = document.getElementById("page");
const reposContainer = document.getElementById("repos-container");

const btnMode = document.getElementById("btn-mode");
const modeIcon = document.getElementById("mode-icon");

const battleToggleBtn = document.getElementById("battle-toggle-btn");
const singleSearch = document.getElementById("single-search");
const battleSearch = document.getElementById("battle-search");
const profileContainer = document.getElementById("profile-container");
const battleContainer = document.getElementById("battle-container");
const input1 = document.getElementById("input1");
const input2 = document.getElementById("input2");
const battleSubmitBtn = document.getElementById("battle-submit-btn");
const battleLoading = document.getElementById("battle-loading");
const battleCards = document.getElementById("battle-cards");

let isBattleMode = false;

const savedTheme = localStorage.getItem("devdetective_theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
updateModeUI(savedTheme);

btnMode.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("devdetective_theme", newTheme);
    updateModeUI(newTheme);
});

function updateModeUI(theme) {
    if (theme === "dark") {
        modeIcon.textContent = "☀️"; 
        document.body.classList.add("dark-mode");
    } else {
        modeIcon.textContent = "🌙"; 
        document.body.classList.remove("dark-mode");
    }
}

battleToggleBtn.addEventListener("click", () => {
    isBattleMode = !isBattleMode;
    if (isBattleMode) {
        battleToggleBtn.textContent = "Single Mode";
        singleSearch.classList.add("hidden");
        profileContainer.classList.add("hidden");
        battleSearch.classList.remove("hidden");
        battleContainer.classList.remove("hidden");
    } else {
        battleToggleBtn.textContent = "Battle Mode";
        battleSearch.classList.add("hidden");
        battleContainer.classList.add("hidden");
        singleSearch.classList.remove("hidden");
       
    }
});

submitBtn.addEventListener("click", () => {
    if (searchInput.value !== "") {
        getUserData(searchInput.value);
    }
});

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && searchInput.value !== "") {
        getUserData(searchInput.value);
    }
});
searchInput.addEventListener("input", (e) => {
    if (e.target.value === "") {
        profileContainer.classList.add("hidden");
        noResults.classList.add("hidden");
    }
});

battleSubmitBtn.addEventListener("click", () => {
    if (input1.value.trim() !== "" && input2.value.trim() !== "") {
        runBattle(input1.value.trim(), input2.value.trim());
    }
});

input1.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input1.value.trim() !== "" && input2.value.trim() !== "") {
        runBattle(input1.value.trim(), input2.value.trim());
    }
});

input2.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input1.value.trim() !== "" && input2.value.trim() !== "") {
        runBattle(input1.value.trim(), input2.value.trim());
    }
});

async function getUserData(username) {
    loadingEl.classList.remove("hidden");
    noResults.classList.add("hidden");
    profileContainer.classList.add("hidden");
    reposContainer.innerHTML = "";

    try {
        const response = await fetch(`https://api.github.com/users/${username}`);

        if (!response.ok) {
            loadingEl.classList.add("hidden");
            noResults.classList.remove("hidden");
            return;
        }

        const data = await response.json();
        loadingEl.classList.add("hidden");
        profileContainer.classList.remove("hidden");
        updateProfile(data);
        getRepositories(data.repos_url);
    } catch (error) {
        loadingEl.classList.add("hidden");
        noResults.classList.add("hidden");
    }
}

async function getRepositories(reposUrl) {
    try {
        const response = await fetch(`${reposUrl}?sort=updated&per_page=5`);
        const repos = await response.json();
        
        loadingEl.classList.add("hidden");
        renderRepos(repos);
    } catch (error) {
        loadingEl.classList.add("hidden");
    }
}

function renderRepos(repos) {
    reposContainer.innerHTML = "";
    if (repos.length === 0) {
        reposContainer.innerHTML = "<p style='color: var(--text-alt); font-size: 14px;'>No public repositories found</p>";
        return;
    }

    repos.forEach(repo => {
        const repoLink = document.createElement("a");
        repoLink.href = repo.html_url;
        repoLink.target = "_blank";
        repoLink.className = "repo-item";
        repoLink.textContent = repo.name;
        reposContainer.appendChild(repoLink);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

function updateProfile(data) {
    avatar.src = data.avatar_url;
    profileName.textContent = data.name || data.login;
    userEl.textContent = `@${data.login}`;
    userEl.href = data.html_url;

    if (data.bio) {
        bioEl.textContent = data.bio;
    } else {
        bioEl.textContent = "This profile has no bio";
    }

    pageEl.textContent = data.blog || "Not Available";
    pageEl.href = data.blog ? (data.blog.startsWith("http") ? data.blog : `https://${data.blog}`) : "#";

    if (data.created_at) {
        dateEl.textContent = `Joined ${formatDate(data.created_at)}`;
    }
}

async function runBattle(user1, user2) {
    battleLoading.classList.remove("hidden");
    const battleError = document.getElementById("battle-error");
    battleError.classList.add("hidden");
    battleCards.innerHTML = "";

    try {
        const [res1, res2] = await Promise.all([
            fetch(`https://api.github.com/users/${user1}`),
            fetch(`https://api.github.com/users/${user2}`)
        ]);

        if (!res1.ok || !res2.ok) {
            battleLoading.classList.add("hidden");
            battleError.textContent = "One or both users not found!";
            battleError.classList.remove("hidden");
            return;
        }

        const data1 = await res1.json();
        const data2 = await res2.json();

        const [repoRes1, repoRes2] = await Promise.all([
            fetch(`${data1.repos_url}?per_page=100`),
            fetch(`${data2.repos_url}?per_page=100`)
        ]);

        const repos1 = await repoRes1.json();
        const repos2 = await repoRes2.json();

        const stars1 = repos1.reduce((total, repo) => total + repo.stargazers_count, 0);
        const stars2 = repos2.reduce((total, repo) => total + repo.stargazers_count, 0);

        battleLoading.classList.add("hidden");
        renderBattleCards(data1, stars1, data2, stars2);
    } catch (error) {
        battleLoading.classList.add("hidden");
    }
}

function renderBattleCards(user1, stars1, user2, stars2) {
    const isUser1Winner = stars1 >= stars2;

    battleCards.innerHTML = `
        <div class="battle-card ${isUser1Winner ? 'winner' : 'loser'}">
            <img src="${user1.avatar_url}" alt="Avatar">
            <h3>${user1.name || user1.login}</h3>
            <p>Total Stars: ${stars1}</p>
            <p>Public Repos: ${user1.public_repos}</p>
            <a href="${user1.html_url}" target="_blank" style="color: var(--btn-bg);">View Profile</a>
        </div>
        <div class="battle-card ${!isUser1Winner ? 'winner' : 'loser'}">
            <img src="${user2.avatar_url}" alt="Avatar">
            <h3>${user2.name || user2.login}</h3>
            <p>Total Stars: ${stars2}</p>
            <p>Public Repos: ${user2.public_repos}</p>
            <a href="${user2.html_url}" target="_blank" style="color: var(--btn-bg);">View Profile</a>
        </div>
    `;
}
// --- Mobile Hamburger Menu Toggle Logic ---
const hamburger = document.getElementById("hamburger");
const headerBtns = document.getElementById("header-btns");
const menuOverlay = document.getElementById("menu-overlay");

function closeMobileMenu() {
    if (window.innerWidth <= 768) {
        headerBtns.classList.remove("active");
        menuOverlay.classList.remove("active");
        hamburger.classList.remove("active");
    }
}

hamburger.addEventListener("click", () => {
    headerBtns.classList.toggle("active");
    menuOverlay.classList.toggle("active");
    hamburger.classList.toggle("active");
});

menuOverlay.addEventListener("click", closeMobileMenu);

headerBtns.addEventListener("click", (e) => {
    e.stopPropagation();
});

battleToggleBtn.addEventListener("click", () => {
    closeMobileMenu();
});

btnMode.addEventListener("click", () => {
    closeMobileMenu();
});
