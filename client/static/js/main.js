let connection;
let playerName = localStorage.getItem('playerName');
let yourTurn = false;
let cmdInProgress = false;
let selectedCard = null;
let currentRoomID = null;

$(document).ready(function () {
    $('#player-name-input').val(playerName);
    initServer();
});

function initServer() {
    connection = new signalR.HubConnectionBuilder()
         .withUrl("https://mtgapi.piotrmadry.pl/GameHub")
        //.withUrl("https://magicthememeingapiprod.azurewebsites.net/GameHub")
        // .withUrl("https://578d-87-206-130-93.ngrok-free.app/GameHub")
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    connectToServer();
    initReceiveMethods();
    initSendMethods();
}

function connectToServer() {
    connection.start().then(() => {
        $('#createRoomButton').removeAttr('disabled', 'disabled');
        $('#joinRoomButton').removeAttr('disabled', 'disabled');
    }).catch(function (err) {
        return console.error("connectToServer :: " + err.toString());
    });

    connection.onclose(error => {
        $('#createRoomButton').attr('disabled');
        $('#joinRoomButton').attr('disabled');
    });
}

function initReceiveMethods() {
    connection.on("ReceiveMessage", function (user, message) {
        const msg = user + " mówi: " + message;
        const li = document.createElement("li");
        li.textContent = msg;
        document.getElementById("games-list").appendChild(li);
    });

    connection.on("ReceiveServerRoomMessage", function (message) {
        $(".lastMessage").html(message);
        addToGameLog(message);
    });

    connection.on("LobbyError", function (message) {
        showLobbyErrorMessage(message);
    });

    connection.on("RoomError", function (message) {
        addToGameLog("<div class='color: red'>" + message + "</div>");
    });

    connection.on("ReceiveMessage", function (user, message) {
        const msg = user + " mówi: " + message;
        const li = document.createElement("li");
        li.textContent = msg;
        document.getElementById("games-list").appendChild(li);
    });

    connection.on("JoinedToRoom", function (roomID, isOwner, otherPlayers) {
        switchToRoom();
        currentRoomID = roomID;
        $("[data-type='roomID']").text(roomID);
        if (isOwner) {
            $("#startGameButton").show();
        }
        $("#playerName").text(playerName);
        document.querySelector("#playerPersistentCards").setAttribute('data-player-name', playerName);
        otherPlayers.forEach((playerName) => addPlayerZone(playerName));
    });

    connection.on("NewPlayerJoinedToRoom", function (playerName) {
        addToGameLog("Player <b>" + playerName + "</b> joined to the room!");
        addPlayerZone(playerName);
    });

    connection.on("GameStarted", function (playerName) {
        $("#startGameButton").hide();
    });

    connection.on("PlacedPersistent", function (deckId, url, target) {
        PlacePersistentCard(deckId, url, target, true)
    });

    connection.on("OtherPlacedPersistent", function (deckId, url, target) {
        PlacePersistentCard(deckId, url, target, false);
    });

    connection.on("RemoveCard", function (deckId, handOnly) {
        RemoveCard(deckId, handOnly);
    });

    connection.on("CardDrawn", function (deckId, url, target) {
        let card = CreateCard(deckId, url, target)

        const parentElement = document.querySelector('#playerHand .card-container');
        parentElement.appendChild(card);
    });

    connection.on("TakeLaugh", function (points) {
        $("#playerHP").text(points);
    });

    connection.on("OtherTookLaugh", function (target, points) {
        document.querySelector('#playersZones .other.player[data-player-name="' + target + '"] .points').innerHTML = points;
    });

    connection.on("TakeGrumpy", function (points) {
        $("#playerHP").text(points);
    });

    connection.on("OtherTookGrumpy", function (target, points) {
        document.querySelector('#playersZones .other.player[data-player-name="' + target + '"] .points').innerHTML = points;
    });

    connection.on("GameEnded", function (message) {
        yourTurn = false;
        ShowEndGameScreen(message);
    });

    connection.on("LastCard", function (url) {
        ShowLastPlayedCard(url);
    });

    connection.on("CardsLeft", function (left) {
        $('#cardInDeck').text(left);
    });

    connection.on("TurnStarted", function () {
        yourTurn = true;
    });

    connection.on("TurnEnd", function () {
        yourTurn = false;
        removeAllSelectedOnCard();
    });
}

function initSendMethods() {
    document.getElementById("createRoomButton").addEventListener("click", function (event) {
        playerName = $('#player-name-input').val();
        localStorage.setItem('playerName', playerName);
        connection.invoke("CreateRoom", playerName).catch(function (err) {
            return console.error(err.toString());
        });
        event.preventDefault();
    });

    document.getElementById("joinRoomButton").addEventListener("click", function (event) {
        let roomID = $('#room-id-input').val();
        playerName = $('#player-name-input').val();
        localStorage.setItem('playerName', playerName);
        connection.invoke("JoinRoom", playerName, roomID).catch(function (err) {
            return console.error(err.toString());
        });
        event.preventDefault();
    });

    document.getElementById("startGameButton").addEventListener("click", function (event) {
        connection.invoke("StartGame").catch(function (err) {
            return console.error(err.toString());
        });
        event.preventDefault();
    });

    $('#playerHand').on('click', '.card', function () {
        disabledSelectPlayerMode();
        if (yourTurn === true) {
            let card = $(this);
            if (card.data('target') === 0) {
                connection.invoke("SendCard", card.data('deck-id'), "").catch(function (err) {
                    return console.error(err.toString());
                });
                hideCardPreview();
            } else {
                removeAllSelectedOnCard();
                $(this).addClass('selected');
                enableSelectPlayerMode(card);
            }
        }
    });

    $(document).on('click', '.player.focus', function () {
        let enemyName = $(this).data('player-name');
        if (selectedCard != null) {
            connection.invoke("SendCard", selectedCard.data('deck-id'), enemyName).catch(function (err) {
                return console.error(err.toString());
            });
            hideCardPreview();

        }
        disabledSelectPlayerMode();
    });


    $('#playerZone').on('mouseenter', '.card', function () {
        showCardPreview(this, true);
    });

    $('#lastCard').on('mouseenter',  function () {
        showCardPreview(this, false);
    });

    $(document).on('mouseenter', '.otherPlayerPersistentCards .card', function () {
        showCardPreview(this, false);
    });

    $(document).on('mouseenter', '.rules', function () {
        showRules();
    });

    $(document).on('mouseleave', '.card, #lastCard, .rules', function () {
        hideCardPreview();
    });


}

function removeAllSelectedOnCard() {
    $('.card.selected').removeClass('selected');
}

function enableSelectPlayerMode(card) {
    selectedCard = card;
    $('.player').addClass('focus');
}

function disabledSelectPlayerMode() {
    removeAllSelectedOnCard();
    $('.player').removeClass('focus');
}

function switchToLobby() {
    $('#lobby').show();
    $('#room').hide();
    window.onbeforeunload = null;
}


function switchToRoom() {
    $('#lobby').hide();
    $('#room').css('display', 'flex');
    window.onbeforeunload = function () {
        return "Are you sure you want to leave this page?";
    };
}

function addToGameLog(message) {
    let li = document.createElement("li");
    li.innerHTML = message;
    document.querySelector("#gameLog ul").appendChild(li);
    let logParent = document.querySelector("#gameLog");
    logParent.scrollTop = logParent.scrollHeight;
}

function showLobbyErrorMessage(message) {
    $("#lobbyErrorMessage").html(message);
}

function addPlayerZone(playerName) {
    const playerZone = document.getElementById('playersZones');

    const playerDiv = document.createElement('div');
    playerDiv.className = 'other player';
    playerDiv.setAttribute('data-player-name', playerName);

    const nameElement = document.createElement('h3');
    nameElement.className = 'otherPlayerName';
    nameElement.textContent = playerName;
    


    const laughElement = document.createElement('h3');
    laughElement.textContent = "LP: " + 0;
    laughElement.className = 'points';
    const playerHandDiv = document.createElement('div');
    playerHandDiv.className = 'otherPlayerPersistentCards';

    playerDiv.appendChild(nameElement);
    // playerDiv.appendChild(laughIconElement); quick fix :) sorry :) 
    playerDiv.appendChild(laughElement);
    playerDiv.appendChild(playerHandDiv);
    playerZone.appendChild(playerDiv);
}

function CreateCard(deckId, url, target) {
    const newDiv = document.createElement('div');
    newDiv.className = 'card';
    newDiv.setAttribute('data-target', target);
    newDiv.setAttribute('data-deck-id', deckId);

    const newImg = document.createElement('img');
    newImg.src = url;

    newDiv.appendChild(newImg);

    return newDiv
}

function PlacePersistentCard(deckId, url, target, owner) {
    let card = CreateCard(deckId, url, target);

    if (owner) {
        const parentElement = document.querySelector('#playerPersistentCards .card-container');
        parentElement.appendChild(card);
    } else {
        const parentElement = document.querySelector('#playersZones .other.player[data-player-name="' + target + '"] .otherPlayerPersistentCards');
        parentElement.appendChild(card);
    }
}

function ShowLastPlayedCard(url){
    let card = CreateCard('', url, '');

     document.querySelector('#lastCard').innerHTML = card.innerHTML;

}

function RemoveCard(deckId, handOnly) {
    if(handOnly){
        $("#playerHand .card[data-deck-id='" + deckId + "']").remove();
    } else {
        $(".card[data-deck-id='" + deckId + "']").remove();
    }

}

function showCardPreview(card, player = false) {
    if (player) {
        $(".card-preview").addClass('offset');
    } else {
        $(".card-preview").removeClass('offset');
    }
    $(".card-preview").show();
    $(".card-preview img").attr('src', $('img', card).attr('src'));
}

function showRules(card, player = false) {
    $(".card-preview").removeClass('offset');
    $(".card-preview").show();
    $(".card-preview img").attr('src', '/static/rules.png');
}

function hideCardPreview() {
    $(".card-preview").hide();
}

function ShowEndGameScreen(message){
    $("#GameOver .message").html(message);
    $("#GameOver").css('display', 'flex');
}

function ForceEndgame(){
    connection.invoke("DebugGameEnded", currentRoomID).catch(function (err) {
        return console.error(err.toString());
    });
}
