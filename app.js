"use strict";

// getCoordinates()
// Demande au navigateur de détecter la position actuelle de l'utilisateur et retourne une Promise
const getCoordinates = () => {
  return new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej)
  );
};

// getPosition()
// Résout la promesse de getCoordinates et retourne un objet {lat: x, long: y}
const getPosition = async () => {
  const position = await getCoordinates();
  return {
    lat: position.coords.latitude,
    long: position.coords.longitude
  };
};

// renderWeather(min, max)
// Affiche la valeu des deux paramêtres dans le widget de météo
const renderWeather = (min, max) => {
  document.querySelector(".min").textContent = `${min}°C`;
  document.querySelector(".max").textContent = `${max}°C`;
  return;
};

// parseStationData(rawData)
// Reçoit la réponse JSON de l'API Transport/stationboard et recrache un objet
// ne contenant que les informations pertinentes.
const parseStationData = (rawData) => {
  const { stationboard } = rawData;
  const departures = stationboard.map((el) => {
    const date = new Date(el.stop.departure);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedHours = date.getHours() < 10 ? "0" + hours : hours;
    const formattedMinutes = date.getMinutes() < 10 ? "0" + minutes : minutes;
    return {
      departure: `${formattedHours}:${formattedMinutes}`,
      destination: el.to,
      category: el.category
    };
  });
  return {
    station: rawData.station.name,
    departures
  };
};

// renderTrain(train)
// Affiche une ligne de départ dans le widget CFF.
const renderTrain = (train) => {
  const board = document.querySelector(".departures");
  const html = `
    <article>
        <div class="time">${train.departure}</div>
        <div class="category" data-category="${train.category}">${train.category}</div>
        <div class="destination">${train.destination}</div>
    </article>
    `;
  board.insertAdjacentHTML("beforeend", html);
  return;
};

// renderStationName(station)
// Affiche le mot passé en paramettre dans le widget CFF. 
const renderStationName = (station) => {
  const stationElement = document.querySelector(".departures header p");
  stationElement.textContent = station;
};

// Votre code peut se trouver dans cette fonction. L'appel vers getPosition est
// déjà implémenté. Si vous jetez un coup d'oeil à votre console vous verrez un objet
// contenant votre position.

const getDashboardInformation = () => {

  getPosition()
    .then((resultat) => {
      // On récupère l'API et on la rend dynamique
      const meteoURL = `https://api.open-meteo.com/v1/forecast?latitude=${resultat.lat}&longitude=${resultat.long}&daily=apparent_temperature_max,apparent_temperature_min&timezone=auto`;
      const stationURL = `http://transport.opendata.ch/v1/locations?x=${resultat.lat}&y=${resultat.long}`;
      // On récuprère toutes les données et on les mets chaqu'une dans un
      // tableau en format JSON
      // On le retourne
      return Promise.all([
        fetch(meteoURL)
        .then((resultat) => resultat.json()),
        fetch(stationURL)
        .then((resultat) => resultat.json()),
      ]);
    })
     // On reprend le retour plus haut (donc les 2 tableaux)
     // et on les remet dans un tableau pour pouvoir manipuler les données. 
    .then((weatherAndStations) => {
      const [meteo, transport] = weatherAndStations;
      // Appel de la fonction permettant d'afficher les informations de météo sur la page.
      renderWeather( 
        // [0] correspond au temps d'aujourd'hui !
        meteo.daily.apparent_temperature_min[0],
        meteo.daily.apparent_temperature_max[0]
      );
      // Permet d'afficher la GARE la plus proche
      // Si on commente les 3 lignes ci-dessous et on décommente la 4e, il va afficher LA GARE OU L'ARRÊT LE PLUS PROCHE
      const station = transport.stations.filter(
        (station) => station.icon === "train"
      )[0];
      // const station = transport.stations[1];

      if (station) {
        renderStationName(station.name);
      } else {
        throw new Error("😅 Pas de station à proximité");
      }
      return fetch(
        `https://transport.opendata.ch/v1/stationboard?station=${station.name}&limit=9`
      ).then((res) => res.json());
    })

    .then((stationboard) => {
      const cleanBoard = parseStationData(stationboard);
      cleanBoard.departures.forEach((train) => {
        renderTrain(train);
      });
    })
    //
    .catch((erreur) => renderStationName(erreur));

  // .catch((erreur) => {
  // console.log("Message d'erreur")
  // })
}

getDashboardInformation()
