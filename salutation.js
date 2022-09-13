message="Bonjour,<br>Je suis Laurent."
//CHANGER POLICE
// style=document.getElementById("salutation").style.fontStyle
// size=document.getElementById("salutation").style.fontSize
i=1
// width = document.getElementById("salutation").offsetWidth+"px"
height = document.getElementById("salutation").offsetHeight+"px"

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function defile() {
    // document.getElementById("salutation").style.width = width
    document.getElementById("salutation").style.height = height
    if(i<=(message.length+1)) {
        
        if (message.substring(i-1, i) == "<") i+=3
        document.getElementById("salutation").innerHTML = message.substring(0, i)
        // document.getElementById("CV").innerHTML = width
        i++
    }
    if(i==message.length+1) {
        i=1
        await sleep(2000)
    }

    setTimeout("defile()", 80)
}