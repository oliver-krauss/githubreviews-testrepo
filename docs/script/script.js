const GITHUB_USER = "oliver-krauss";
const GITHUB_REPO = "githubreviews-testrepo";

const popup = document.getElementById("annotation-popup");
const submitBtn = document.getElementById("annotation-submit");
const commentList = document.getElementById("comment-list");
const appendListElement = document.createElement("li");

let TEST_PAT = "";

/* Original file-based PAT loader (kept for reference and commented out):
fetch("../secrets/config.json")
    .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
    })
    .then(cfg => {
        console.log("Config loaded:", cfg);
        TEST_PAT = cfg.testPat
    })
    .catch(err => {
        console.error("Failed to load config:", err);
    });
*/

// Active behavior: prompt the user for a PAT once per browser session and store it in sessionStorage.
(function initTestPat(){
    try {
        const stored = sessionStorage.getItem('testPat');
        if (stored) {
            TEST_PAT = stored;
            console.log('TEST_PAT loaded from sessionStorage.');
            return;
        }

        const input = window.prompt("Enter a GitHub Personal Access Token (PAT) to create issues (stored in sessionStorage for this session). Leave blank to skip:");
        if (input && input.trim()) {
            TEST_PAT = input.trim();
            sessionStorage.setItem('testPat', TEST_PAT);
            console.log('TEST_PAT saved to sessionStorage.');
        } else {
            console.log('No TEST_PAT provided. Issue creation will not work until you enter a token.');
        }
    } catch (e) {
        console.error('Unable to access sessionStorage or prompt for PAT:', e);
    }
})();

// Console helper to set/clear the PAT during the active session.
window.setTestPat = function() {
    const input = window.prompt("Enter new GitHub PAT (stored in sessionStorage for this session). Leave blank to clear:");
    if (input && input.trim()) {
        TEST_PAT = input.trim();
        sessionStorage.setItem('testPat', TEST_PAT);
        alert('PAT saved to sessionStorage for this session.');
    } else {
        sessionStorage.removeItem('testPat');
        TEST_PAT = "";
        alert('PAT cleared from sessionStorage.');
    }
};

let lastSelection = null;
let anchorInfo = {};

document.addEventListener("mouseup", () => {
    popup.addEventListener("click", (event) => {
        event.stopPropagation();
    });
    const sel = window.getSelection();
    const text = sel.toString().trim();

    if (!text) {
        popup.style.display = "none";
        return;
    }

    lastSelection = text;
    const rect = sel.getRangeAt(0).getBoundingClientRect();

    anchorInfo = {
        page: location.href,
        selectedText: text,
        startOffset: sel.anchorOffset,
        endOffset: sel.focusOffset
    };

    popup.style.left = rect.x + "px";
    popup.style.top = rect.y + window.scrollY + rect.height + "px";
    popup.style.display = "block";
});

submitBtn.onclick = async () => {
    const body = document.querySelector("#annotation-popup textarea").value.trim();

    if (!body || !lastSelection){
        return;
    }

    // Require the user-provided PAT for creating issues
    if (!TEST_PAT) {
        alert('No Personal Access Token (PAT) set. Use window.setTestPat() in the console to set one for this session.');
        return;
    }

    const query = `"${lastSelection}" repo:${GITHUB_USER}/${GITHUB_REPO}`;

    const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/vnd.github.v3.text-match+json",
            "Authorization": `token ${TEST_PAT}`
        }
    });

    if (!response.ok) {
        console.error("GitHub search failed", await response.text());
        return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        console.log(response)
        console.log("No matches found for selection");
        return null;
    }

    // For now, just take the first match
    const match = data.items[0];

    console.log(data.items);
    console.log(match);

    //let repoSnippet = "";
    //
    // if (match.text_matches && match.text_matches.length > 0) {
    //     repoSnippet = match.text_matches[0].fragment;
    // } else {
    //     repoSnippet = anchorInfo.selectedText;
    // }
    //
    // const issueBody = `
    // ### Inline Annotation
    //
    // **Page:** ${anchorInfo.page}
    // **Repo file:** \`${match}\`
    // **GitHub link:** ${match.html_url}
    //
    // **Selected Text (on page):**
    // > ${anchorInfo.selectedText}
    //
    // **Matching Code/Text in Repo:**
    // \`\`\`
    // ${repoSnippet}
    // \`\`\`
    //
    // **Comment:**
    // ${body}
    // `.trim();

    const issueBody =
        `### Inline Annotation\n` +
        `**Page:** ${anchorInfo.page}\n` +
        `**Selected Text:** "${anchorInfo.selectedText}"\n` +
        `**Selection Offsets:** start=${anchorInfo.startOffset}, end=${anchorInfo.endOffset}\n\n` +
        `**Comment:**\n${body}`;

    const payload = {
        title: "Annotation: " + anchorInfo.selectedText.substring(0, 20) + "...",
        body: issueBody
    };

    let responseText = "Comment created in GitHub Issues!";
    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/issues`, {
            method: "POST",
            headers: {
                "Authorization": `token ${TEST_PAT}`,
                "Accept": "application/vnd.github+json"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            responseText = "Comment couldn't be created!\n" + res.statusText;
        }

    } finally {
        popup.style.display = "none";
        document.querySelector("#annotation-popup textarea").value = "";
        appendListElement.textContent = body;
        console.log(appendListElement.textContent);
        commentList.appendChild(appendListElement);

        alert(responseText);
    }
};

function toggleCommentPanel() {
    const panel = document.getElementById("comment-panel");
    const body = document.body;

    panel.classList.toggle("open");
    body.classList.toggle("with-panel");
}
