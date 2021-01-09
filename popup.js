const save = document.getElementById('save');
var recipe;

chrome.runtime.onMessage.addListener(function (request, sender) {
    save.disabled = true;
    if (request.action == "getRecipe") {
        save.disabled = false;
        recipe = request.source;
        let name = document.getElementById('name');
        name.textContent = recipe.name;
    }
});

chrome.tabs.query({
    active: true,
    currentWindow: true
}, tabs => {
    let embededEle = document.getElementById('embeded');
    fetch(embededEle.src)
        .then(response => response.text())
        .then(data => {
            chrome.tabs.executeScript(
                tabs[0].id, {
                code: data + `scrapper();`
            }
            );
        });
});

save.addEventListener('click', function () {
    let baseUrl = "https://api.github.com/repos";
    chrome.storage.local.get(function (data) {
        repo = data.repo;
        user = data.user;
        token = data.token;

        url = `${baseUrl}/${data.user}/${data.repo}/contents/content/recipes/${toPath(recipe.name)}/index.md`;
        let markdown = toMD();
        let base64 = btoa(unescape(encodeURIComponent(markdown)));
        let sha = sha1(markdown);

        const request = new Request(url, {
            method: 'PUT'
        });
        let body = `{"message": "test", "content": "${base64}", "sha": "${sha}"}`;
        request.body = body;
        request.headers.append("accept", "application/vnd.github.v3+json");
        request.headers.append("Authorization", "token " + data.token);

        busyToggle();

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
                busyToggle();
            }).catch(error => {
                busyToggle();
                alert(error);
            });
    });
});

function busyToggle() {
    const save = document.getElementById('save');
    const spinner = document.getElementById('spinner');
    save.disabled = !save.disabled;
    spinner.classList.toggle("spinner");
}

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

function toMD() {
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