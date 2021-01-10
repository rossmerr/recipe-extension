const sync = document.getElementById('sync');
const missing = document.getElementById('missing');
const timeout = 3000;

chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.action == "getRecipe") {
        sync.classList.toggle("hidden");
        save(request.source);
        setTimeout(function () {
            sync.classList.toggle("hidden");
            window.close();
        }, timeout);

    }
    else if (request.action == "noRecipe") {
        missing.classList.toggle("hidden");
        setTimeout(function () {
            missing.classList.toggle("hidden");
            window.close();
        }, timeout);

    }
    else {
        window.close();
    }
});

chrome.tabs.query({
    active: true,
    currentWindow: true
}, tabs => {
    let clientScript = document.getElementById('client');
    fetch(clientScript.src)
        .then(response => response.text())
        .then(script => {
            chrome.tabs.executeScript(
                tabs[0].id, {
                code: script
            }
            );
        });
});

function save(recipe) {
    let baseUrl = "https://api.github.com/repos";
    chrome.storage.local.get(function (data) {
        repo = data.repo;
        user = data.user;
        token = data.token;

        url = `${baseUrl}/${data.user}/${data.repo}/contents/content/recipes/${toPath(recipe.name)}/index.md`;
        let markdown = toMD(recipe);
        let base64 = btoa(unescape(encodeURIComponent(markdown)));
        let sha = sha1(markdown);

        const request = new Request(url, {
            method: 'PUT'
        });
        let body = `{"message": "test", "content": "${base64}", "sha": "${sha}"}`;
        request.body = body;
        request.headers.append("accept", "application/vnd.github.v3+json");
        request.headers.append("Authorization", "token " + data.token);


        fetch(request)
            .then(response => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return response.text().then(data => {
                        throw new Error('Something went wrong on api server!' + data);
                    });
                }
            })
            .then(response => {
            }).catch(error => {
                alert(error);
            });
    });
};

function toPath(str) {
    let filename = str.toLowerCase();
    return filename.replaceAll(" ", "-");
}

function toBulletList(arr) {
    if (arr == undefined || arr.length == 0) {
        return "";
    }
    const separator = "- ";
    let s = separator + arr.join('\n' + separator);
    return s;
}

function toMD(recipe) {
    let date = new Date().toISOString();
    return `---
layout: recipe
date: ${date}
title: ${recipe.name || ""}
image: ${recipe.image || ""}
YouTubeID:  ${recipe.video || ""}
authorName: ${recipe.author || ""}
sourceURL: ${recipe.url || ""}
category: ${recipe.recipeCategory || ""} 
cuisine: ${recipe.recipeCuisine || ""}
yield: ${recipe.yield || ""}
prepTime: ${recipe.prepTime || ""}
cookTime: ${recipe.cookTime || ""}
directions:
${toBulletList(recipe.recipeInstructions)}
ingredients:
${toBulletList(recipe.recipeIngredient)}
---
${recipe.description || ""}
`;
}