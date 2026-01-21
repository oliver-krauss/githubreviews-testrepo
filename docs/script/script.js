//import TextHighlighter from "https://esm.sh/@perlego/text-highlighter";

const GITHUB_USER = "oliver-krauss";
const GITHUB_REPO = "githubreviews-testrepo";

const popup = document.getElementById("annotation-popup");
const submitBtn = document.getElementById("annotation-submit");
const commentList = document.getElementById("comment-list");

let text = "";
let TEST_PAT = "";

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
    popup.addEventListener("mouseup", (event) => {
        event.stopPropagation();
    });
    const sel = window.getSelection();
    text = sel.toString();

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

    console.log("fun");
});

submitBtn.onclick = async () => {
    const body = document.querySelector("#annotation-popup textarea").value.trim();

    if (!body || !lastSelection){
        return;
    }

    if (!TEST_PAT) {
        alert('No Personal Access Token (PAT) set. Use window.setTestPat() in the console to set one for this session.');
        return;
    }
    console.log(lastSelection);

    const fileInput = "index.html";
    let fileQualifier = "";
    if (fileInput && fileInput.trim()) {
        const f = fileInput.trim();
        fileQualifier = f.includes("/") ? ` path:${f}` : ` filename:${f}`;
    }
    console.log(fileQualifier);

    const query = `"${lastSelection}" repo:${GITHUB_USER}/${GITHUB_REPO}${fileQualifier}`;

    const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}`;
    console.log(url);

    const response = await fetch(url, {
        headers: {
            "Accept": 'application/vnd.github.v3+json',
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

    console.log("data.content:" + data.content);

    const match = data.items[0];
    console.log(match.path);
    const stuff = await fetchGithubFileContent(match.path);
    console.log(stuff);

    //let repoSnippet = "";

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
        // const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/issues`, {
        //     method: "POST",
        //     headers: {
        //         "Authorization": `token ${TEST_PAT}`,
        //         "Accept": "application/vnd.github+json"
        //     },
        //     body: JSON.stringify(payload)
        // });
        //
        // if (!res.ok) {
        //     responseText = "Comment couldn't be created!\n" + res.statusText;
        // }

    } finally {
        addToCommentList(body)
        popup.style.display = "none";
        document.querySelector("#annotation-popup textarea").value = "";
        alert(responseText);
    }
};

async function fetchGithubFileContent(path, branch = "main") {
    if (!path) return null;
    const apiPath = path.split('/').map(encodeURIComponent).join('/');
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${apiPath}?ref=${encodeURIComponent(branch)}`;

    const res = await fetch(url, {
        headers: {
            "Accept": "application/vnd.github.v3.raw",
            "Authorization": TEST_PAT ? `token ${TEST_PAT}` : undefined
        }
    });

    if (!res.ok) {
        try {
            const json = await res.json();
            if (json && json.content) {
                const base64 = json.content.replace(/\n/g, "");
                try {
                    return decodeURIComponent(escape(atob(base64)));
                } catch (e) {
                    console.log("fallback decoding");
                    return atob(base64);
                }
            } else {
                console.error("GitHub contents API error:", json);
                return null;
            }
        } catch (e) {
            console.error("Fetch failed:", res.status, await res.text());
            return null;
        }
    }

    return await res.text();
}

function toggleCommentPanel() {
    console.log("toggleCommentPanel");
    const panel = document.getElementById("comment-panel");
    const body = document.body;

    panel.classList.toggle("open");
    body.classList.toggle("with-panel");
}

function addToCommentList(commentText) {
    const appendListElement = document.createElement("li");
    const addDivElement = document.createElement("div");
    const textElement = document.createElement("p");
    const buttonElement = document.createElement("button");
    textElement.textContent = commentText;
    buttonElement.textContent = "delete"
    buttonElement.onclick = function() {
        commentList.removeChild(appendListElement);
    };
    addDivElement.appendChild(textElement);
    addDivElement.appendChild(buttonElement);
    appendListElement.appendChild(addDivElement);
    commentList.appendChild(appendListElement);
}