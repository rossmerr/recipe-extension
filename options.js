let save = document.getElementById('save');
let repo = document.getElementById('repo');
let token = document.getElementById('token');
let user = document.getElementById('user');

chrome.storage.local.get(function (data) {
    repo.value = data.repo;
    token.value = data.token;
    user.value = data.user;
});

save.addEventListener('click', function () {
    chrome.storage.local.set({
        repo: repo.value,
        token: token.value,
        user: user.value
    }, function () {});

    chrome.storage.sync.set({
        repo: repo.value,
        token: token.value,
        user: user.value
    }, function () {});
});