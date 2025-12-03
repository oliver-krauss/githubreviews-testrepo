const GITHUB_USER = "oliver-krauss";
const GITHUB_REPO = "githubreviews-testrepo";
const GITHUB_TOKEN = "";

const popup = document.getElementById("annotation-popup");
const submitBtn = document.getElementById("annotation-submit");
const commentList = document.getElementById("comment-list");
const appendListElement = document.createElement("li");

let TEST_PAT = ""
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

    if (!body){
        return;
    }

    const query = `"${body}" repo:${GITHUB_USER}/${GITHUB_REPO}`;

    const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/vnd.github.v3.text-match+json",
            "Authorization": `token ${GITHUB_TOKEN}`
        }
    });

    if (!response.ok) {
        console.error("GitHub search failed", await response.text());
        return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        console.log("No matches found for selection");
        return null;
    }

    // For now, just take the first match
    const match = data.items[0];

    console.log(match);

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
