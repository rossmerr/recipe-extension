const save = document.getElementById('save');
var recipe;

chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.action == "getRecipe") {
        let name = document.getElementById('name');
        recipe = request.source;
        name.textContent = recipe.name;
        save.disabled = false;
    }
});

chrome.tabs.query({
    active: true,
    currentWindow: true
}, tabs => {
    let s = `
        (function() {
            let name = document.querySelector('[itemprop="name"]').textContent;
            let recipe = {
                name: name
            }

            chrome.runtime.sendMessage({action: "getRecipe", source: recipe});
        })();
    `;

    chrome.tabs.executeScript(
        tabs[0].id, {
            code: s
        }
    );
});

save.addEventListener('click', function () {
    let baseUrl = "https://api.github.com/repos";
    chrome.storage.local.get(function (data) {
        repo = data.repo;
        user = data.user;
        token = data.token;

        url = `${baseUrl}/${data.user}/${data.repo}/contents/content/recipes/test-${toPath()}/index.md`;
        let markdown = toMD();
        let base64 = btoa(markdown);
        let sha = sha1(markdown);

        const request = new Request(url, {
            method: 'PUT'
        });
        request.body = `{"message": "test", "content": "${base64}", "sha": "${sha}"}`;
        request.headers.append("accept", "application/vnd.github.v3+json");
        request.headers.append("Authorization", "token " + data.token);

        save.disabled = true;

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
                save.disabled = false;
            }).catch(error => {
                save.disabled = false;
                alert(error);
            });
    });
});

function toPath() {
    let filename = recipe.name.toLowerCase();
    return filename.replaceAll(" ", "-");
}

function toMD() {
    let date = new Date().toISOString();

    return `---
layout: recipe
date: ${date}
title: ${recipe.name}
image: ${recipe.image}
YouTubeID:  ${recipe.video}
authorName: ${recipe.author}
sourceURL: ${recipe.url}
category: ${recipe.recipeCategory} 
cuisine: ${recipe.recipeCuisine}
yield: ${recipe.yield}
prepTime: ${recipe.prepTime}
cookTime: ${recipe.performTime}

ingredients:
${recipe.recipeIngredient}

directions:
${recipe.recipeInstructions}
---
${recipe.description}
`;
}