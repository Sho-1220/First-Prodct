// DOM要素の取得
const homeScreen = document.getElementById('home-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const highscoresScreen = document.getElementById('highscores-screen');
const startButton = document.getElementById('start-button');
const highscoresButton = document.getElementById('highscores-button');
const backButton = document.getElementById('back-button');
const backButtonResult = document.getElementById('back-button-result'); // 結果画面の戻るボタン
const playAgainButton = document.getElementById('play-again');
const submitScoreButton = document.getElementById('submit-score');
const questionElement = document.getElementById('question');
const choicesContainer = document.getElementById('choices');
const feedbackElement = document.getElementById('feedback');
const timerElement = document.getElementById('time');
const totalTimerElement = document.getElementById('total-time'); // トータルタイマー要素
const scoreElement = document.getElementById('current-score');
const finalScoreElement = document.getElementById('final-score');
const highscoresList = document.getElementById('highscores-list');
const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');
const categorySelect = document.getElementById('category-select');
const difficultySelect = document.getElementById('difficulty-select');
// クイズデータの取得
let quizData = [];
// 連続正解数を追跡する変数
let consecutiveCorrect = 0;
// ページ読み込み時にクイズデータを取得
window.addEventListener('DOMContentLoaded', () => {
    fetch('data/quiz-data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            quizData = data;
            console.log('クイズデータを取得しました。', quizData);
            populateCategories(); // カテゴリーの選択肢を動的に生成
        })
        .catch(error => console.error('クイズデータの読み込みに失敗しました:', error));
});
// カテゴリと難易度の動的生成
function populateCategories() {
    const categories = [...new Set(quizData.map(q => q.category))];
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    const difficulties = [...new Set(quizData.map(q => q.difficulty))];
    difficulties.forEach(difficulty => {
        const option = document.createElement('option');
        option.value = difficulty;
        option.textContent = difficulty;
        difficultySelect.appendChild(option);
    });
    console.log('カテゴリーと難易度の選択肢が追加されました。');
}
// 状態管理
let currentQuiz = [];
let currentQuestionIndex = 0;
let score = 0;
let questionTimer;
let totalTimer;
let timeLeft = 30; // 質問タイマーの秒数
let totalTimeLeft = 300; // トータルタイマーの秒数（例: 5分）
// イベントリスナーの設定
startButton.addEventListener('click', startQuiz);
highscoresButton.addEventListener('click', showHighscores);
backButton.addEventListener('click', () => showScreen(homeScreen)); // ハイスコア画面の戻るボタン
backButtonResult.addEventListener('click', () => showScreen(homeScreen)); // 結果画面の戻るボタン
playAgainButton.addEventListener('click', startQuiz);
submitScoreButton.addEventListener('click', submitScore); // 'submit'から 'click' に変更
// スクリーン表示関数
function showScreen(screen) {
    // 全てのスクリーンから 'active' クラスを削除
    homeScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    resultScreen.classList.remove('active');
    highscoresScreen.classList.remove('active');
    // 指定されたスクリーンに 'active' クラスを追加
    screen.classList.add('active');
}
// クイズ開始
function startQuiz() {
    const selectedCategory = categorySelect.value;
    const selectedDifficulty = difficultySelect.value;
    console.log(`選択されたカテゴリー: ${selectedCategory}`);
    console.log(`選択された難易度: ${selectedDifficulty}`);
    // フィルタリング
    currentQuiz = quizData.filter(quiz => {
        const categoryMatch = selectedCategory === 'all' || quiz.category === selectedCategory;
        const difficultyMatch = selectedDifficulty === 'all' || quiz.difficulty === selectedDifficulty;
        return categoryMatch && difficultyMatch;
    });
    console.log(`フィルタリング後のクイズ数: ${currentQuiz.length}`);
    if (currentQuiz.length === 0) {
        alert('選択したカテゴリーや難易度に該当するクイズがありません。');
        return;
    }
    // 問題をシャッフル
    shuffleArray(currentQuiz);
    console.log('問題をシャッフルしました。');
    currentQuestionIndex = 0;
    score = 0;
    scoreElement.textContent = score;
    consecutiveCorrect = 0; // 連続正解数をリセット
    showScreen(quizScreen);
    loadQuestion();
    startTotalTimer(); // トータルタイマーを開始
}
// トータルタイマーの開始
function startTotalTimer() {
    clearInterval(totalTimer);
    totalTimeLeft = 60; // トータルタイマーの秒数（例: 5分）
    totalTimerElement.textContent = formatTime(totalTimeLeft);
    totalTimer = setInterval(() => {
        totalTimeLeft--;
        totalTimerElement.textContent = formatTime(totalTimeLeft);
        if (totalTimeLeft <= 0) {
            clearInterval(totalTimer);
            clearInterval(questionTimer);
            handleTimeUpForTotal();
        }
    }, 1000);
}
// トータルタイマーのフォーマット関数
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}
// クイズの読み込み
function loadQuestion() {
    clearFeedback();
    if (currentQuestionIndex >= currentQuiz.length) {
        endQuiz();
        return;
    }
    const quiz = currentQuiz[currentQuestionIndex];
    console.log(`現在の問題: ${quiz.question}`);
    questionElement.textContent = quiz.question;
    choicesContainer.innerHTML = '';
    // 選択肢をシャッフル
    const shuffledChoices = [...quiz.choices];
    shuffleArray(shuffledChoices);
    console.log('選択肢をシャッフルしました。');
    shuffledChoices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = choice;
        button.addEventListener('click', () => selectAnswer(quiz, choice));
        choicesContainer.appendChild(button);
    });
    // カテゴリー表示
    const categoryText = `カテゴリー: ${quiz.category}`;
    document.getElementById('category').textContent = categoryText;
    console.log(categoryText);
    // 質問タイマーの開始
    startQuestionTimer();
}
// 質問タイマーの開始
function startQuestionTimer() {
    clearInterval(questionTimer);
    timeLeft = 30; // 質問タイマーの秒数
    timerElement.textContent = timeLeft;
    questionTimer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(questionTimer);
            handleTimeUpForQuestion();
        }
    }, 1000);
}
// 回答選択時の処理
function selectAnswer(quiz, selectedChoice) {
    clearInterval(questionTimer);
    const correctAnswer = quiz.choices[quiz.correct];
    const isCorrect = selectedChoice === correctAnswer;
    if (isCorrect) {
        score += 10;
        scoreElement.textContent = score;
        feedbackElement.textContent = '正解！ ' + quiz.explanation;
        feedbackElement.classList.add('correct');
        feedbackElement.classList.remove('wrong');
        correctSound.play();
        consecutiveCorrect++;
        // 連続5問正解したらトータルタイムを10秒加算
        if (consecutiveCorrect % 5 === 0) {
            totalTimeLeft += 10;
            // 最大トータルタイムを設定したい場合はここで制限を加えることも可能
            // 例: const MAX_TOTAL_TIME = 600; // 例として10分
            // if (totalTimeLeft < MAX_TOTAL_TIME) {
            //     totalTimeLeft += 10;
            // }
            totalTimerElement.textContent = formatTime(totalTimeLeft);
            alert('連続5問正解しました！トータルタイムに10秒加算されました。');
        }
    } else {
        feedbackElement.textContent = `不正解。正しい答えは "${correctAnswer}" です。`;
        feedbackElement.classList.add('wrong');
        feedbackElement.classList.remove('correct');
        wrongSound.play();
        consecutiveCorrect = 0; // 連続正解数をリセット
        // 不正解の場合、トータルタイムから10秒を減算
        totalTimeLeft -= 10;
        if (totalTimeLeft < 0) {
            totalTimeLeft = 0;
        }
        totalTimerElement.textContent = formatTime(totalTimeLeft);
        alert('不正解のため、トータルタイムから10秒減算されました。');
    }
    currentQuestionIndex++;
    setTimeout(() => {
        if (totalTimeLeft <= 0) {
            endQuiz();
        } else {
            loadQuestion();
            // トータルタイマーは既に開始されているため、再度開始する必要はありません
        }
    }, 2000);
}
// タイムアップ（質問タイマー）の処理
function handleTimeUpForQuestion() {
    const quiz = currentQuiz[currentQuestionIndex];
    if (quiz) {
        const correctAnswer = quiz.choices[quiz.correct];
        feedbackElement.textContent = `時間切れ！ 正しい答えは "${correctAnswer}" です。`;
        feedbackElement.classList.add('wrong');
        feedbackElement.classList.remove('correct');
        wrongSound.play();
        consecutiveCorrect = 0; // 連続正解数をリセット
        // 時間切れの場合、トータルタイムから10秒を減算
        totalTimeLeft -= 10;
        if (totalTimeLeft < 0) {
            totalTimeLeft = 0;
        }
        totalTimerElement.textContent = formatTime(totalTimeLeft);
        alert('時間切れのため、トータルタイムから10秒減算されました。');
        currentQuestionIndex++;
        setTimeout(() => {
            if (totalTimeLeft <= 0) {
                endQuiz();
            } else {
                loadQuestion();
                // トータルタイマーは既に開始されているため、再度開始する必要はありません
            }
        }, 2000);
    } else {
        endQuiz();
    }
}
// タイムアップ（トータルタイマー）の処理
function handleTimeUpForTotal() {
    alert('時間切れです。クイズを終了します。');
    endQuiz();
}
// クイズ終了
function endQuiz() {
    clearInterval(questionTimer);
    clearInterval(totalTimer);
    finalScoreElement.textContent = score;
    showScreen(resultScreen);
}
// フィードバックのクリア
function clearFeedback() {
    feedbackElement.textContent = '';
    feedbackElement.classList.remove('correct', 'wrong');
}
// ハイスコアの表示
function showHighscores() {
    highscoresList.innerHTML = '';
    const highscores = JSON.parse(localStorage.getItem('highscores')) || [];
    highscores.sort((a, b) => b.score - a.score);
    highscores.slice(0, 10).forEach(entry => { // 上位10件を表示
        const li = document.createElement('li');
        li.textContent = `${entry.username} - ${entry.score}点`;
        highscoresList.appendChild(li);
    });
    showScreen(highscoresScreen);
}
// スコアの送信
function submitScore() {
    const username = document.getElementById('username').value.trim();
    if (username === '') {
        alert('ユーザー名を入力してください。');
        return;
    }
    const highscores = JSON.parse(localStorage.getItem('highscores')) || [];
    highscores.push({ username, score });
    highscores.sort((a, b) => b.score - a.score);
    highscores.splice(10); // 上位10件に制限
    localStorage.setItem('highscores', JSON.stringify(highscores));
    document.getElementById('username').value = '';
    showHighscores();
}
// シャッフル関数（Fisher-Yatesアルゴリズム）
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}