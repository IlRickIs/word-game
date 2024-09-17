// Version: 1.0
const loadingBar = document.querySelector(".loading-bar");
const wordAPI = "https://words.dev-apis.com/word-of-the-day";
const verifyAPI = "https://words.dev-apis.com/validate-word";
let currentWord = 0;
let currentColumn = 0;
const cells = [];
let wordOfTheDay;
let handling = false;
let newWord = false;
document.getElementById("new-word").addEventListener("click", () => {
    newWord = true;
    init();
    document.getElementById("new-word").blur();
});

function init(){
    if(!newWord){
        fetchWordOfTheDay().then((word) => {
            wordOfTheDay = word;
        });
        makeWordGrid();
    }else{
        fetchRandomWord().then((word) =>
        {wordOfTheDay = word});
        resetValues();
        resetGrid();
    }
    document.addEventListener('keyup', myKeyUp);
    
}

function resetValues(){
    currentWord = 0;
    currentColumn = 0;
    handling = false;
}

function resetGrid(){
    for(i=0; i<6; i++){
        for(j=0; j<5; j++){
            cells[i][j].innerText = "";
            cells[i][j].classList.remove("correct", "wrong", "wrong-position");
        }
    }
}

function myKeyUp(event){
    handleKeyPress(event.key);
}

function makeWordGrid(){
    let currentCell = 1;
    for(i=0; i<6; i++){
        cells[i] = [];
        for(j=0; j<5; j++){
            cells[i].push(document.getElementById(`cell-${currentCell}`));
            currentCell++;
        }
    }
    currentCell = 1;
}

function printMatrix(matrix){
    for(i=0; i<matrix.length; i++){
        let row = "";
        for(j=0; j<matrix[i].length; j++){
            row += matrix[i][j].id + " ";
        }
        console.log(row);
    }
}

async function fetchRandomWord(){
    try{
        const response = await fetch("https://random-word-api.herokuapp.com/word?length=5");
        if(!response.ok){
            alert("Error fetching random word");
            detachListeners();
            throw new Error(`HTTP error: ${response.status}`);
        }
        const randomWord = await response.json();
        console.log(`fetched ${randomWord[0]}`);
        return randomWord[0];
    }catch(error){
        alert("Error fetching random word");
        console.error(`Error fetching random word: ${error}`);
        detachListeners();
    }finally{
        setLoading(false);
    }
}

async function fetchWordOfTheDay(){
    try{
        const response = await fetch(wordAPI);
        if(!response.ok){
            alert("Error fetching word of the day");
            detachListeners();
            throw new Error(`HTTP error: ${response.status}`);
        }
        const dayWord = await response.json();
        console.log(`fetched ${dayWord.word}`);
        return dayWord.word
    }catch(error){
        alert("Error fetching word of the day");
        console.error(`Error fetching word of the day: ${error}`);
        detachListeners();
    }finally{
        setLoading(false);
    }
}

function setLoading(isLoading){
    if(isLoading){
        loadingBar.classList.remove("hidden");
    }else{
        loadingBar.classList.add("hidden");
    }
}

function isLetter(letter) {
    return /^[a-zA-Z]$/.test(letter);
  }

function handleKeyPress(key) {
    if(key === "Enter" && !handling){
        handling = true;
        handleEnter();
    }
    if ((key === 'Backspace' || key === "Delete") && !handling) {
        handleBackspace();
    }
    if (isLetter(key) && !handling) {
        handleLetter(key);
    }
}

function handleLetter(letter){
    if(currentColumn === 5){
        currentColumn = 4;
    }
    cells[currentWord][currentColumn].innerText = letter;
    currentColumn++;
}

function handleBackspace(){
    if(currentColumn > 0){
        currentColumn--;
        cells[currentWord][currentColumn].innerText = "";
    }
}

async function handleEnter(){
    if(currentColumn !== 5){
        handling = false;
        return;
    }
    setLoading(true);
    let myWordArr = cells[currentWord];
    let myWordStr = myWordArr.map(cell => cell.innerText).join('');
    if(await isMyWordValid(myWordStr)){
        setLoading(false);
        await new Promise(r => setTimeout(r, 100));
        if(myWordStr.toLowerCase() === wordOfTheDay){
           checkLetters(myWordStr);
           alert("congratulations, you won!");
           detachListeners();
           document.getElementById("title").classList.add("anim-rainbow");
        }else if(currentWord === 5){
            alert("Game over, the word was: " + wordOfTheDay);
            checkLetters(myWordStr);
            detachListeners();
        }
        else{
            checkLetters(myWordStr);
            currentWord++;
            currentColumn = 0;
        }
    }else{
        console.log("Word is not valid");
        InvalidWordAnimation()
        setLoading(false);
        handling = false;
        return;
    }
    handling = false;
}

function InvalidWordAnimation(){
    cells[currentWord].forEach(cell => {
        cell.classList.add("invalid-word");
    });
    setTimeout(() => {
        cells[currentWord].forEach(cell => {
            cell.classList.remove("invalid-word");
        });
    }, 1000);

}

function detachListeners(){
    document.removeEventListener('keyup', myKeyUp);
}
    
async function isMyWordValid(myWord){
    const promise = await fetch(verifyAPI, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"word": myWord})
    });
    let response = await promise.json();
    return response.validWord;
}

function checkLetters(wordArr){
    wordArr = wordArr.toLowerCase();
    console.log(`The word to verify is: ${wordArr}`);
    console.log(`The word of the day is: ${wordOfTheDay}`);
    let verifyIndexes = [];
    let verifyWord = wordOfTheDay;
    for(i=0; i<wordArr.length; i++){
        if(wordArr[i] === wordOfTheDay[i]){
            cells[currentWord][i].classList.add("correct");
            verifyWord = verifyWord.slice(0, i) + verifyWord.slice(i + 1);
        }else{
            verifyIndexes.push(i);
        }
    }
    let lettersDone = [];
    verifyIndexes.forEach(element => {
        for(i = 0; i < wordArr.length; i++){
            if(wordArr[i] === wordOfTheDay[element]){
                if(lettersDone.includes(i)){
                    continue;
                }
                if(cells[currentWord][i].classList.contains("correct")){
                    continue;
                }
                cells[currentWord][i].classList.add("wrong-position");
                lettersDone.push(i);
                break;
            }
        }
    });

    for(i=0;i<5;i++){
        if(!(cells[currentWord][i].classList.contains("correct") ||
            cells[currentWord][i].classList.contains("wrong-position")))
            {
                cells[currentWord][i].classList.add("wrong")
            }
    }
}

init();