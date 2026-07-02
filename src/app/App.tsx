import { useState, useCallback, useRef, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import { feature as topoFeature } from "topojson-client";
import { geoCentroid } from "d3-geo";
// @ts-ignore
import spainData from "es-atlas/es/provinces.json";

// ─── Precompute centroids ─────────────────────────────────────────────────────

const _features = (topoFeature(spainData as any, (spainData as any).objects.provinces) as any).features;
const PROVINCE_CENTROIDS: Record<string, [number, number]> = {};
_features.forEach((f: any) => {
  const name: string = f.properties?.name ?? "";
  if (name && !name.includes("Gibraltar")) {
    PROVINCE_CENTROIDS[name] = geoCentroid(f) as [number, number];
  }
});

// ─── Types ────────────────────────────────────────────────────────────────────

type TriviaQ = { q: string; a: string; options: string[] };
type ProvinceData = { fact: string; trivia: TriviaQ[] };

// ─── Province facts + trivia (2 questions each, rotate to avoid repeats) ──────

const PROVINCE_DATA: Record<string, ProvinceData> = {
  "Albacete": {
    fact: "¡Albacete es la capital mundial de las navajas artesanales! Llevan siglos fabricando cuchillos finísimos a mano.",
    trivia: [
      { q: "¿Por qué objeto artesanal es famosa Albacete?", a: "Las navajas", options: ["Las espadas", "Las navajas", "Los escudos"] },
      { q: "¿En qué famosa llanura está Albacete?", a: "La Mancha", options: ["La Mancha", "La Meseta Norte", "El Aljarafe"] },
    ],
  },
  "Alacant/Alicante": {
    fact: "¡En Alicante hacen las Hogueras de San Juan, una fiesta donde queman monumentos gigantes de cartón pintado!",
    trivia: [
      { q: "¿Qué fiestas queman figuras gigantes en Alicante?", a: "Las Hogueras de San Juan", options: ["Las Fallas", "Las Hogueras de San Juan", "Los Sanfermines"] },
      { q: "¿Sobre qué montaña hay un castillo en Alicante?", a: "El Benacantil", options: ["El Montgó", "El Benacantil", "El Puig"] },
    ],
  },
  "Almería": {
    fact: "¡En Almería rodaron muchas películas del Oeste americano! El desierto de Tabernas es el único desierto de verdad de Europa.",
    trivia: [
      { q: "¿Qué tipo de películas se rodaron en el desierto de Almería?", a: "Del Oeste (spaghetti western)", options: ["De ciencia ficción", "Del Oeste (spaghetti western)", "De piratas"] },
      { q: "¿Qué tiene Almería que es único en toda Europa?", a: "Un desierto real", options: ["Una selva tropical", "Un desierto real", "Un glaciar"] },
    ],
  },
  "Ávila": {
    fact: "¡Ávila tiene la muralla medieval más completa del mundo! Tiene 88 torres y más de 2,5 km de longitud.",
    trivia: [
      { q: "¿Cuántas torres tiene la muralla de Ávila?", a: "88 torres", options: ["10 torres", "88 torres", "200 torres"] },
      { q: "¿Qué ciudad de España tiene la muralla medieval más completa del mundo?", a: "Ávila", options: ["Toledo", "Ávila", "Segovia"] },
    ],
  },
  "Badajoz": {
    fact: "¡En Mérida, dentro de Badajoz, hay un teatro romano de 2.000 años que todavía se usa para obras de teatro!",
    trivia: [
      { q: "¿Con qué país hace frontera Badajoz?", a: "Portugal", options: ["Francia", "Portugal", "Marruecos"] },
      { q: "¿Qué civilización dejó ruinas impresionantes en Mérida?", a: "Los romanos", options: ["Los griegos", "Los romanos", "Los egipcios"] },
    ],
  },
  "Illes Balears": {
    fact: "¡Las cuevas del Drach en Mallorca tienen uno de los lagos subterráneos más grandes del mundo, con 177 metros de largo!",
    trivia: [
      { q: "¿Cuál es la isla más grande de Baleares?", a: "Mallorca", options: ["Ibiza", "Mallorca", "Menorca"] },
      { q: "¿Qué hay dentro de las cuevas del Drach en Mallorca?", a: "Un lago subterráneo gigante", options: ["Un volcán dormido", "Un lago subterráneo gigante", "Un tesoro pirata"] },
    ],
  },
  "Barcelona": {
    fact: "¡La Sagrada Família lleva más de 140 años construyéndose y aún no ha terminado! Gaudí empezó a construirla en 1882.",
    trivia: [
      { q: "¿Quién diseñó la Sagrada Família de Barcelona?", a: "Antoni Gaudí", options: ["Pablo Picasso", "Antoni Gaudí", "Joan Miró"] },
      { q: "¿En qué año empezaron a construir la Sagrada Família?", a: "En 1882", options: ["En 1492", "En 1882", "En 1950"] },
    ],
  },
  "Burgos": {
    fact: "¡En la sierra de Atapuerca, cerca de Burgos, encontraron los huesos humanos más antiguos de Europa, de hace 900.000 años!",
    trivia: [
      { q: "¿Qué encontraron en Atapuerca, cerca de Burgos?", a: "Los huesos humanos más antiguos de Europa", options: ["Huesos de dinosaurio", "Los huesos humanos más antiguos de Europa", "Un tesoro medieval"] },
      { q: "¿Qué famoso héroe medieval nació cerca de Burgos?", a: "El Cid Campeador", options: ["Don Quijote", "El Cid Campeador", "Santiago Apóstol"] },
    ],
  },
  "Cáceres": {
    fact: "¡Las calles medievales de Cáceres salieron en Juego de Tronos como Desembarco del Rey! Sus calles parecen de hace 500 años.",
    trivia: [
      { q: "¿Para qué famosa serie usaron las calles de Cáceres?", a: "Juego de Tronos", options: ["Harry Potter", "Juego de Tronos", "El Señor de los Anillos"] },
      { q: "¿Qué pájaro icónico abunda en los campanarios de Cáceres?", a: "La cigüeña", options: ["El flamenco", "La cigüeña", "El loro"] },
    ],
  },
  "Cádiz": {
    fact: "¡Cádiz es la ciudad habitada más antigua de España con más de 3.000 años! La fundaron los fenicios.",
    trivia: [
      { q: "¿Quiénes fundaron Cádiz hace más de 3.000 años?", a: "Los fenicios", options: ["Los romanos", "Los fenicios", "Los griegos"] },
      { q: "¿Qué famosa batalla naval ocurrió cerca de Cádiz en 1805?", a: "La batalla de Trafalgar", options: ["La batalla de Lepanto", "La batalla de Trafalgar", "La batalla del Cabo"] },
    ],
  },
  "Castelló/Castellón": {
    fact: "¡El castillo de Peñíscola, en Castellón, está construido sobre una roca rodeada de mar por tres lados! Parece una isla.",
    trivia: [
      { q: "¿Sobre qué está construido el castillo de Peñíscola?", a: "Una roca rodeada de mar por tres lados", options: ["Una montaña muy alta", "Una roca rodeada de mar por tres lados", "Una isla entera"] },
      { q: "¿Qué fruta es muy famosa en Castellón?", a: "La naranja", options: ["El limón", "La naranja", "La mandarina roja"] },
    ],
  },
  "Ciudad Real": {
    fact: "¡Las Lagunas de Ruidera son 15 lagunas encadenadas unidas por cascadas! Son tan azules que parecen pintadas.",
    trivia: [
      { q: "¿Cuántas lagunas encadenadas tiene el parque de Ruidera?", a: "15 lagunas", options: ["3 lagunas", "15 lagunas", "50 lagunas"] },
      { q: "¿Con qué personaje literario se relaciona La Mancha de Ciudad Real?", a: "Don Quijote de la Mancha", options: ["Don Juan Tenorio", "Don Quijote de la Mancha", "El Lazarillo de Tormes"] },
    ],
  },
  "Córdoba": {
    fact: "¡La Mezquita-Catedral de Córdoba tiene más de 856 columnas de mármol y jaspe de colores! Es única en el mundo.",
    trivia: [
      { q: "¿Cuántas columnas tiene la Mezquita de Córdoba?", a: "Más de 856", options: ["50 columnas", "200 columnas", "Más de 856"] },
      { q: "¿Qué dos tipos de edificio hay dentro de la Mezquita de Córdoba?", a: "Mezquita árabe y catedral cristiana", options: ["Templo romano y teatro", "Mezquita árabe y catedral cristiana", "Sinagoga y palacio"] },
    ],
  },
  "A Coruña": {
    fact: "¡La Torre de Hércules es el faro más antiguo del mundo que todavía funciona! Tiene casi 1.900 años y fue construida por los romanos.",
    trivia: [
      { q: "¿Cuántos años tiene la Torre de Hércules de A Coruña?", a: "Casi 1.900 años", options: ["300 años", "900 años", "Casi 1.900 años"] },
      { q: "¿Para qué sirve todavía hoy la Torre de Hércules?", a: "De faro para los barcos", options: ["De prisión", "De faro para los barcos", "De iglesia"] },
    ],
  },
  "Cuenca": {
    fact: "¡Las Casas Colgadas de Cuenca están construidas al borde de un precipicio de 40 metros! Parecen flotar en el aire.",
    trivia: [
      { q: "¿Cuántos metros de altura tiene el precipicio bajo las Casas Colgadas de Cuenca?", a: "40 metros", options: ["5 metros", "40 metros", "400 metros"] },
      { q: "¿Cómo se llaman las rocas con formas raras del parque natural de Cuenca?", a: "La Ciudad Encantada", options: ["El Valle de la Luna", "La Ciudad Encantada", "Las Pirámides de Tierra"] },
    ],
  },
  "Girona": {
    fact: "¡Las calles medievales de Girona salieron en Juego de Tronos como la ciudad de Desembarco del Rey! Tienen más de 1.000 años.",
    trivia: [
      { q: "¿Para qué famosa serie usaron las calles de Girona?", a: "Juego de Tronos", options: ["El Señor de los Anillos", "Juego de Tronos", "Vikingos"] },
      { q: "¿Cómo se llama la costa brava y bonita que hay en Girona?", a: "Costa Brava", options: ["Costa del Sol", "Costa Brava", "Costa Dorada"] },
    ],
  },
  "Granada": {
    fact: "¡La Alhambra de Granada fue un palacio árabe con más de 1.000 fuentes de agua! Los árabes la construyeron hace 700 años.",
    trivia: [
      { q: "¿Quiénes construyeron la Alhambra de Granada?", a: "Los árabes nazaríes", options: ["Los romanos", "Los árabes nazaríes", "Los visigodos"] },
      { q: "¿Qué bebida fría se inventó en Andalucía y es típica de Granada?", a: "El gazpacho", options: ["La horchata", "El gazpacho", "El zumo de naranja"] },
    ],
  },
  "Guadalajara": {
    fact: "¡La miel de La Alcarria de Guadalajara es la más famosa de España! Las abejas la hacen con flores de lavanda y tomillo.",
    trivia: [
      { q: "¿Qué producto dulce y natural es famoso en Guadalajara?", a: "La miel de La Alcarria", options: ["El mazapán", "La miel de La Alcarria", "El turrón"] },
      { q: "¿Qué tipo de paisaje hay en la Alcarria de Guadalajara?", a: "Campos con lavanda y tomillo", options: ["Playa y palmeras", "Campos con lavanda y tomillo", "Nieve y glaciares"] },
    ],
  },
  "Gipuzkoa": {
    fact: "¡San Sebastián tiene más estrellas Michelin por habitante que cualquier otra ciudad del mundo! La gastronomía vasca es la mejor.",
    trivia: [
      { q: "¿Por qué es famosa la comida en San Sebastián de Gipuzkoa?", a: "Tiene más estrellas Michelin por habitante que ninguna otra ciudad", options: ["Tiene el restaurante más grande del mundo", "Tiene más estrellas Michelin por habitante que ninguna otra ciudad", "Tiene el restaurante más barato"] },
      { q: "¿Cómo se llaman los aperitivos en palillo típicos del País Vasco?", a: "Pintxos", options: ["Tapas", "Pintxos", "Montaditos"] },
    ],
  },
  "Huelva": {
    fact: "¡Cristóbal Colón salió de Huelva en 1492 para descubrir América! Zarpó desde el Puerto de Palos con tres carabelas.",
    trivia: [
      { q: "¿De qué pueblo de Huelva salió Colón hacia América en 1492?", a: "Palos de la Frontera", options: ["Cádiz", "Palos de la Frontera", "Huelva capital"] },
      { q: "¿Cuántas carabelas llevaba Colón cuando salió de Huelva?", a: "3 carabelas", options: ["1 barco", "3 carabelas", "10 barcos"] },
    ],
  },
  "Huesca": {
    fact: "¡El Aneto, en los Pirineos de Huesca, es la montaña más alta de España con 3.404 metros! Está siempre nevada.",
    trivia: [
      { q: "¿Cuántos metros tiene el Aneto, la montaña más alta de España?", a: "3.404 metros", options: ["1.000 metros", "3.404 metros", "8.000 metros"] },
      { q: "¿En qué cordillera están las montañas de Huesca?", a: "Los Pirineos", options: ["Los Alpes", "Los Pirineos", "Los Andes"] },
    ],
  },
  "Jaén": {
    fact: "¡Jaén produce el 20% del aceite de oliva de todo el mundo! Sus campos de olivos son tan grandes que se ven desde el espacio.",
    trivia: [
      { q: "¿Qué porcentaje del aceite de oliva mundial produce Jaén?", a: "El 20%", options: ["El 1%", "El 20%", "El 50%"] },
      { q: "¿Qué árbol cubre casi toda la provincia de Jaén?", a: "El olivo", options: ["La encina", "El olivo", "La palmera"] },
    ],
  },
  "León": {
    fact: "¡La catedral de León tiene 1.800 metros cuadrados de vidrieras de colores! Cuando entra el sol, el interior se llena de luz de colores.",
    trivia: [
      { q: "¿Cuántos metros cuadrados de vidrieras de colores tiene la catedral de León?", a: "1.800 metros cuadrados", options: ["10 metros cuadrados", "100 metros cuadrados", "1.800 metros cuadrados"] },
      { q: "¿Qué famoso camino de peregrinación pasa por León?", a: "El Camino de Santiago", options: ["La Ruta de la Seda", "El Camino de Santiago", "La Ruta de los Conquistadores"] },
    ],
  },
  "Lleida": {
    fact: "¡En las rocas de Lleida hay pinturas prehistóricas de hace 7.000 años! Los humanos de la Edad de Piedra las pintaron con tierras de colores.",
    trivia: [
      { q: "¿Cuántos años tienen las pinturas rupestres de las rocas de Lleida?", a: "7.000 años", options: ["500 años", "2.000 años", "7.000 años"] },
      { q: "¿Qué idioma hablan en Lleida además del español?", a: "El catalán", options: ["El francés", "El catalán", "El valenciano"] },
    ],
  },
  "La Rioja": {
    fact: "¡En La Rioja encontraron huellas de dinosaurios gigantes de hace 150 millones de años! Son las más grandes que se conocen en Europa.",
    trivia: [
      { q: "¿Qué descubrimiento prehistórico hay en La Rioja?", a: "Huellas de dinosaurios gigantes", options: ["Huevos de dinosaurio", "Huellas de dinosaurios gigantes", "Dientes de tiburón prehistórico"] },
      { q: "¿Qué bebida famosa se hace con uvas en La Rioja?", a: "Vino tinto", options: ["Cerveza", "Vino tinto", "Sidra"] },
    ],
  },
  "Lugo": {
    fact: "¡Lugo es la única ciudad del mundo completamente rodeada por una muralla romana intacta! Tiene 71 torres y 10 puertas.",
    trivia: [
      { q: "¿Qué tiene Lugo que es único en todo el mundo?", a: "Una muralla romana completa que la rodea entera", options: ["Una pirámide romana", "Una muralla romana completa que la rodea entera", "Un anfiteatro romano flotante"] },
      { q: "¿Cuántas torres tiene la muralla romana de Lugo?", a: "71 torres", options: ["5 torres", "71 torres", "300 torres"] },
    ],
  },
  "Madrid": {
    fact: "¡El Museo del Prado de Madrid tiene más de 7.600 pinturas! Es uno de los cinco museos de arte más importantes del mundo entero.",
    trivia: [
      { q: "¿Cuántas pinturas tiene el Museo del Prado de Madrid?", a: "Más de 7.600", options: ["200 pinturas", "1.000 pinturas", "Más de 7.600"] },
      { q: "¿Cómo se llama el parque más famoso del centro de Madrid?", a: "El Retiro", options: ["El Retiro", "El Prado", "La Casa de Campo"] },
    ],
  },
  "Málaga": {
    fact: "¡Pablo Picasso nació en Málaga en 1881! El pintor más famoso del siglo XX vivía en la calle de la Merced.",
    trivia: [
      { q: "¿Qué pintor mundialmente famoso nació en Málaga?", a: "Pablo Picasso", options: ["Salvador Dalí", "Pablo Picasso", "Francisco de Goya"] },
      { q: "¿Cuántos días soleados tiene Málaga al año aproximadamente?", a: "Más de 300 días", options: ["100 días", "200 días", "Más de 300 días"] },
    ],
  },
  "Murcia": {
    fact: "¡La huerta de Murcia produce tanta fruta y verdura que la llaman la huerta de Europa! Sus tomates y pimientos viajan a todo el mundo.",
    trivia: [
      { q: "¿Cómo llaman a Murcia por sus cultivos de frutas y verduras?", a: "La huerta de Europa", options: ["El jardín de España", "La huerta de Europa", "El granero del mundo"] },
      { q: "¿Qué especia picante roja es famosa en Murcia?", a: "El pimentón", options: ["La pimienta", "El pimentón", "El curry"] },
    ],
  },
  "Navarra": {
    fact: "¡Los Sanfermines de Pamplona son los más famosos del mundo! Cada día durante 9 días los toros corren por las calles de la ciudad.",
    trivia: [
      { q: "¿En qué ciudad de Navarra son los famosos Sanfermines?", a: "Pamplona", options: ["Tudela", "Pamplona", "Estella"] },
      { q: "¿En qué mes se celebran los Sanfermines de Pamplona?", a: "En julio", options: ["En enero", "En julio", "En octubre"] },
    ],
  },
  "Ourense": {
    fact: "¡En Ourense brotan del suelo fuentes de agua caliente a 65 grados naturalmente! Es como tener un spa de la naturaleza.",
    trivia: [
      { q: "¿A cuántos grados sale el agua caliente natural de Ourense?", a: "65 grados", options: ["20 grados", "65 grados", "100 grados"] },
      { q: "¿En qué comunidad autónoma está Ourense?", a: "Galicia", options: ["Asturias", "Galicia", "Castilla y León"] },
    ],
  },
  "Asturias": {
    fact: "¡Las pinturas rupestres de las cuevas de Asturias tienen 36.000 años y son las más famosas del mundo! Los humanos del Paleolítico pintaron bisontes.",
    trivia: [
      { q: "¿Hace cuántos años pintaron los humanos prehistóricos en las cuevas de Asturias?", a: "36.000 años", options: ["1.000 años", "10.000 años", "36.000 años"] },
      { q: "¿Por qué bebida de manzana es famosa Asturias?", a: "La sidra", options: ["El zumo", "La sidra", "La cerveza"] },
    ],
  },
  "Palencia": {
    fact: "¡Palencia tiene más iglesias románicas por kilómetro cuadrado que ninguna otra provincia de España! Le llaman el 'Románico Palentino'.",
    trivia: [
      { q: "¿Por qué tipo de iglesias antiguas es famosa Palencia?", a: "Por las iglesias románicas", options: ["Por las catedrales góticas", "Por las iglesias románicas", "Por las basílicas barrocas"] },
      { q: "¿Qué pájaro grande y blanco anida en los campanarios de Palencia?", a: "La cigüeña", options: ["El águila real", "La cigüeña", "El pelícano"] },
    ],
  },
  "Pontevedra": {
    fact: "¡Las Islas Cíes de Pontevedra fueron elegidas la playa más bonita del mundo por el periódico The Guardian! Sus aguas son de color turquesa.",
    trivia: [
      { q: "¿Cómo se llaman las islas más bonitas de Pontevedra?", a: "Islas Cíes", options: ["Islas Atlánticas", "Islas Cíes", "Islas Ons"] },
      { q: "¿Qué marisco grande en concha es muy típico de las Rías de Pontevedra?", a: "El mejillón", options: ["La langosta roja", "El mejillón", "El calamar gigante"] },
    ],
  },
  "Salamanca": {
    fact: "¡La Universidad de Salamanca es la más antigua de España y una de las más antiguas de Europa! Fue fundada en 1218, hace más de 800 años.",
    trivia: [
      { q: "¿En qué año fue fundada la Universidad de Salamanca?", a: "En 1218", options: ["En 1900", "En 1492", "En 1218"] },
      { q: "¿De qué color especial son los edificios históricos de Salamanca?", a: "Dorado (piedra arenisca)", options: ["Blanco puro", "Rojo ladrillo", "Dorado (piedra arenisca)"] },
    ],
  },
  "Cantabria": {
    fact: "¡Los Picos de Europa de Cantabria llegan a 2.648 metros y están a solo 15 km del mar! Es la única cordillera tan cercana al Cantábrico.",
    trivia: [
      { q: "¿Cómo se llaman las montañas famosas de Cantabria cerca del mar?", a: "Picos de Europa", options: ["Picos de Europa", "Sierra Nevada", "Sierra de Gredos"] },
      { q: "¿En qué cueva de Cantabria hay famosas pinturas prehistóricas de bisontes?", a: "Cueva de Altamira", options: ["Cueva del Drach", "Cueva de Altamira", "Cueva de Nerja"] },
    ],
  },
  "Segovia": {
    fact: "¡El acueducto romano de Segovia tiene 2.000 años y está formado por 167 arcos! No tiene ni un gramo de cemento, solo gravedad.",
    trivia: [
      { q: "¿Cuántos arcos tiene el acueducto romano de Segovia?", a: "167 arcos", options: ["10 arcos", "167 arcos", "1.000 arcos"] },
      { q: "¿Qué castillo de Segovia fue el modelo del castillo de Disney?", a: "El Alcázar de Segovia", options: ["El Alcázar de Segovia", "El Castillo de Belmonte", "La Alhambra"] },
    ],
  },
  "Sevilla": {
    fact: "¡La Giralda de Sevilla tiene 98 metros de alto! Primero fue un minarete árabe y luego los cristianos le pusieron una torre de campanas encima.",
    trivia: [
      { q: "¿Cuántos metros mide la Giralda de Sevilla?", a: "98 metros", options: ["30 metros", "98 metros", "300 metros"] },
      { q: "¿Qué flor es el símbolo de Sevilla que hay en todos sus patios?", a: "El naranjo y sus azahares", options: ["La rosa roja", "El naranjo y sus azahares", "El clavel"] },
    ],
  },
  "Soria": {
    fact: "¡Soria es la provincia con menos habitantes de toda España! Tiene más ovejas que personas.",
    trivia: [
      { q: "¿Cuál es la provincia menos poblada de España?", a: "Soria", options: ["Teruel", "Soria", "Cuenca"] },
      { q: "¿Qué poeta escribió sobre los campos y álamos de Soria?", a: "Antonio Machado", options: ["Federico García Lorca", "Antonio Machado", "Gustavo Adolfo Bécquer"] },
    ],
  },
  "Tarragona": {
    fact: "¡Tarragona tiene un anfiteatro romano de 2.000 años junto al mar Mediterráneo! Los romanos lo construyeron para sus espectáculos de gladiadores.",
    trivia: [
      { q: "¿Qué construcción romana de 2.000 años hay en Tarragona junto al mar?", a: "Un anfiteatro de gladiadores", options: ["Un coliseo de gladiadores", "Un anfiteatro de gladiadores", "Un estadio de cuadrigas"] },
      { q: "¿Cómo se llama la tradición de hacer torres humanas típica de Tarragona?", a: "Los castellers", options: ["Los castellers", "Los gegants", "Los correfoc"] },
    ],
  },
  "Teruel": {
    fact: "¡En Teruel han encontrado más fósiles de dinosaurios que en ningún otro lugar de España! Tienen hasta el esqueleto completo de un dinosaurio enorme.",
    trivia: [
      { q: "¿Por qué son famosas las excavaciones de Teruel?", a: "Por sus fósiles de dinosaurios", options: ["Por sus monedas romanas", "Por sus fósiles de dinosaurios", "Por sus pinturas rupestres"] },
      { q: "¿Qué historia de amor famosa es de Teruel?", a: "Los Amantes de Teruel", options: ["Romeo y Julieta", "Los Amantes de Teruel", "Calisto y Melibea"] },
    ],
  },
  "Toledo": {
    fact: "¡Toledo fue llamada Ciudad de las Tres Culturas porque convivieron en paz árabes, judíos y cristianos durante siglos!",
    trivia: [
      { q: "¿Por qué Toledo se llama 'Ciudad de las Tres Culturas'?", a: "Porque convivieron árabes, judíos y cristianos", options: ["Porque tiene tres ríos", "Porque convivieron árabes, judíos y cristianos", "Porque tiene tres castillos"] },
      { q: "¿De qué material especial son las famosas espadas artesanales de Toledo?", a: "Acero toledano templado", options: ["Oro puro", "Acero toledano templado", "Bronce antiguo"] },
    ],
  },
  "València/Valencia": {
    fact: "¡Las Fallas de Valencia son unas fiestas donde queman esculturas gigantes de cartón! Algunas miden más de 30 metros de altura.",
    trivia: [
      { q: "¿Qué pasa al final de las Fallas de Valencia con las figuras de cartón?", a: "Las queman en una gran hoguera", options: ["Las meten en un museo", "Las queman en una gran hoguera", "Las venden en subasta"] },
      { q: "¿Qué plato de arroz con mariscos inventaron en Valencia?", a: "La paella valenciana", options: ["El risotto italiano", "La paella valenciana", "El arroz con bogavante"] },
    ],
  },
  "Valladolid": {
    fact: "¡Miguel de Cervantes, el autor de Don Quijote, vivió en Valladolid! Puedes visitar la casa donde escribía sus aventuras.",
    trivia: [
      { q: "¿Qué famoso escritor del Siglo de Oro vivió en Valladolid?", a: "Miguel de Cervantes", options: ["Miguel de Cervantes", "Lope de Vega", "Francisco de Quevedo"] },
      { q: "¿Qué vino famoso se produce en la Ribera del Duero, cerca de Valladolid?", a: "Vino tinto Ribera del Duero", options: ["Rioja blanco", "Vino tinto Ribera del Duero", "Cava de Valladolid"] },
    ],
  },
  "Bizkaia": {
    fact: "¡El Puente Colgante de Bizkaia es el puente transportador más antiguo del mundo! Tiene 132 años y mueve una góndola que cruza personas a la orilla de enfrente.",
    trivia: [
      { q: "¿Qué tiene de especial el Puente Colgante de Bizkaia?", a: "Es el puente transportador más antiguo del mundo", options: ["Es el más largo del mundo", "Es el puente transportador más antiguo del mundo", "Es el más alto de Europa"] },
      { q: "¿Qué museo de arte moderno con forma de titanio hay en Bilbao?", a: "El Museo Guggenheim", options: ["El Museo del Prado", "El Museo Guggenheim", "El Reina Sofía"] },
    ],
  },
  "Zamora": {
    fact: "¡Zamora tiene más iglesias románicas por metro cuadrado que cualquier otra ciudad del mundo! Tiene 24 monumentos románicos en solo 500 metros.",
    trivia: [
      { q: "¿Por qué récord mundial es famosa Zamora?", a: "Tiene más iglesias románicas por metro cuadrado del mundo", options: ["Tiene la catedral más grande", "Tiene más iglesias románicas por metro cuadrado del mundo", "Tiene la muralla más larga"] },
      { q: "¿Junto a qué gran río está la ciudad de Zamora?", a: "El río Duero", options: ["El río Tajo", "El río Duero", "El río Ebro"] },
    ],
  },
  "Zaragoza": {
    fact: "¡La Basílica del Pilar de Zaragoza tiene 11 cúpulas de colores y es enorme! Cada año millones de personas van en peregrinación a visitarla.",
    trivia: [
      { q: "¿Cuántas cúpulas tiene la Basílica del Pilar de Zaragoza?", a: "11 cúpulas", options: ["3 cúpulas", "11 cúpulas", "25 cúpulas"] },
      { q: "¿Qué río grande pasa por debajo de la Basílica del Pilar de Zaragoza?", a: "El río Ebro", options: ["El río Tajo", "El río Ebro", "El río Guadalquivir"] },
    ],
  },
  "Ceuta": {
    fact: "¡Ceuta es una ciudad española que está en África! En solo 35 minutos llegas en barco desde Algeciras.",
    trivia: [
      { q: "¿En qué continente está la ciudad española de Ceuta?", a: "En África", options: ["En Europa", "En África", "En Asia"] },
      { q: "¿Cuánto tiempo tarda el barco desde España hasta Ceuta?", a: "35 minutos", options: ["35 minutos", "3 horas", "10 horas"] },
    ],
  },
  "Melilla": {
    fact: "¡Melilla tiene edificios modernistas increíbles! Es la ciudad del mundo con más edificios de este estilo después de Barcelona.",
    trivia: [
      { q: "¿En qué continente está la ciudad española de Melilla?", a: "En África", options: ["En Europa", "En África", "En Asia"] },
      { q: "¿Qué estilo arquitectónico bonito es muy famoso en Melilla?", a: "El modernismo", options: ["El gótico medieval", "El modernismo", "El barroco"] },
    ],
  },
  "Araba/Álava": {
    fact: "¡Vitoria-Gasteiz, la capital de Álava, fue elegida Capital Verde Europea! Es una de las ciudades más ecológicas y sostenibles del mundo.",
    trivia: [
      { q: "¿Por qué fue elegida especial Vitoria-Gasteiz, capital de Álava?", a: "Por ser Capital Verde de Europa", options: ["Por ser la ciudad más fría", "Por ser Capital Verde de Europa", "Por ser la más antigua"] },
      { q: "¿Qué famoso vino tinto se produce en la Rioja Alavesa de Álava?", a: "El vino Rioja", options: ["El cava", "El vino Rioja", "La sidra vasca"] },
    ],
  },
  "Las Palmas": {
    fact: "¡El Carnaval de Las Palmas de Gran Canaria es uno de los más grandes del mundo después del de Río de Janeiro! Con disfraces increíbles.",
    trivia: [
      { q: "¿Qué carnaval del mundo es más grande que el de Las Palmas?", a: "El de Río de Janeiro", options: ["El de Venecia", "El de Río de Janeiro", "El de Tenerife"] },
      { q: "¿Cuál es la isla más grande de la provincia de Las Palmas?", a: "Gran Canaria", options: ["Fuerteventura", "Gran Canaria", "Lanzarote"] },
    ],
  },
  "Santa Cruz de Tenerife": {
    fact: "¡El Teide de Tenerife es el volcán más alto de España con 3.718 metros! Es la montaña más alta de España y la tercera del mundo entre islas volcánicas.",
    trivia: [
      { q: "¿Cuántos metros de altura tiene el volcán Teide de Tenerife?", a: "3.718 metros", options: ["1.500 metros", "3.718 metros", "8.848 metros"] },
      { q: "¿Qué tipo de montaña es el Teide de Tenerife?", a: "Un volcán", options: ["Una pirámide natural", "Un volcán", "Un glaciar"] },
    ],
  },
};

// ─── Community colors (for map rendering) ────────────────────────────────────

type Community = { name: string; emoji: string; fill: string; hover: string; stroke: string };

const COMMUNITIES: Record<string, Community> = {
  andalucia:           { name: "Andalucía",              emoji: "💃", fill: "#fca5a5", hover: "#f87171", stroke: "#b91c1c" },
  aragon:              { name: "Aragón",                  emoji: "⛰️", fill: "#fdba74", hover: "#fb923c", stroke: "#c2410c" },
  asturias:            { name: "Asturias",                emoji: "🐄", fill: "#bef264", hover: "#a3e635", stroke: "#4d7c0f" },
  baleares:            { name: "Illes Balears",           emoji: "🏖️", fill: "#67e8f9", hover: "#22d3ee", stroke: "#0e7490" },
  canarias:            { name: "Canarias",                emoji: "🌋", fill: "#fde68a", hover: "#fcd34d", stroke: "#b45309" },
  cantabria:           { name: "Cantabria",               emoji: "🏔️", fill: "#6ee7b7", hover: "#34d399", stroke: "#047857" },
  "castilla-la-mancha":{ name: "Castilla-La Mancha",      emoji: "⚔️", fill: "#c4b5fd", hover: "#a78bfa", stroke: "#6d28d9" },
  "castilla-y-leon":   { name: "Castilla y León",         emoji: "🏰", fill: "#fbcfe8", hover: "#f9a8d4", stroke: "#9d174d" },
  cataluna:            { name: "Cataluña",                emoji: "🎨", fill: "#93c5fd", hover: "#60a5fa", stroke: "#1e40af" },
  extremadura:         { name: "Extremadura",             emoji: "🦅", fill: "#86efac", hover: "#4ade80", stroke: "#15803d" },
  galicia:             { name: "Galicia",                 emoji: "🌊", fill: "#a5f3fc", hover: "#67e8f9", stroke: "#0e7490" },
  rioja:               { name: "La Rioja",                emoji: "🍷", fill: "#fef08a", hover: "#fde047", stroke: "#a16207" },
  madrid:              { name: "Comunidad de Madrid",     emoji: "👑", fill: "#fed7aa", hover: "#fdba74", stroke: "#c2410c" },
  murcia:              { name: "Región de Murcia",        emoji: "🌸", fill: "#e9d5ff", hover: "#d8b4fe", stroke: "#7e22ce" },
  navarra:             { name: "Navarra",                 emoji: "🐂", fill: "#bbf7d0", hover: "#86efac", stroke: "#166534" },
  "pais-vasco":        { name: "País Vasco",              emoji: "🍴", fill: "#99f6e4", hover: "#5eead4", stroke: "#0f766e" },
  valenciana:          { name: "Comunitat Valenciana",    emoji: "🍊", fill: "#fecdd3", hover: "#fda4af", stroke: "#9f1239" },
  ceuta:               { name: "Ceuta",                   emoji: "🌍", fill: "#e2e8f0", hover: "#cbd5e1", stroke: "#475569" },
  melilla:             { name: "Melilla",                 emoji: "🌍", fill: "#e2e8f0", hover: "#cbd5e1", stroke: "#475569" },
};

const P2C: Record<string, string> = {
  "Albacete":"castilla-la-mancha","Alacant/Alicante":"valenciana","Almería":"andalucia",
  "Ávila":"castilla-y-leon","Badajoz":"extremadura","Illes Balears":"baleares",
  "Barcelona":"cataluna","Burgos":"castilla-y-leon","Cáceres":"extremadura","Cádiz":"andalucia",
  "Castelló/Castellón":"valenciana","Ciudad Real":"castilla-la-mancha","Córdoba":"andalucia",
  "A Coruña":"galicia","Cuenca":"castilla-la-mancha","Girona":"cataluna","Granada":"andalucia",
  "Guadalajara":"castilla-la-mancha","Gipuzkoa":"pais-vasco","Huelva":"andalucia","Huesca":"aragon",
  "Jaén":"andalucia","León":"castilla-y-leon","Lleida":"cataluna","La Rioja":"rioja","Lugo":"galicia",
  "Madrid":"madrid","Málaga":"andalucia","Murcia":"murcia","Navarra":"navarra","Ourense":"galicia",
  "Asturias":"asturias","Palencia":"castilla-y-leon","Pontevedra":"galicia","Salamanca":"castilla-y-leon",
  "Cantabria":"cantabria","Segovia":"castilla-y-leon","Sevilla":"andalucia","Soria":"castilla-y-leon",
  "Tarragona":"cataluna","Teruel":"aragon","Toledo":"castilla-la-mancha","València/Valencia":"valenciana",
  "Valladolid":"castilla-y-leon","Bizkaia":"pais-vasco","Zamora":"castilla-y-leon","Zaragoza":"aragon",
  "Ceuta":"ceuta","Melilla":"melilla","Araba/Álava":"pais-vasco",
  "Las Palmas":"canarias","Santa Cruz de Tenerife":"canarias",
};

function getComm(name: string): Community | null {
  const key = P2C[name];
  return key ? COMMUNITIES[key] ?? null : null;
}

const CANARY_NAMES = new Set(["Las Palmas", "Santa Cruz de Tenerife"]);
const isCanary = (geo: any) => CANARY_NAMES.has(geo.properties?.name);

function displayName(raw: string): string {
  if (raw.includes("/")) return raw.split("/").pop()!.trim();
  return raw;
}

// ─── Medals ───────────────────────────────────────────────────────────────────

const MEDALS = [
  { pts: 1,   name: "Explorador Novato",    icon: "🌱", color: "#86efac", stroke: "#15803d", desc: "¡Has empezado tu aventura!" },
  { pts: 5,   name: "Viajero Curioso",      icon: "⭐", color: "#fde68a", stroke: "#a16207", desc: "¡Ya conoces 5 curiosidades!" },
  { pts: 10,  name: "Aventurero",           icon: "🎒", color: "#fdba74", stroke: "#c2410c", desc: "¡10 respuestas correctas!" },
  { pts: 20,  name: "Experto en España",    icon: "🥉", color: "#d4b896", stroke: "#92400e", desc: "¡20 puntos conseguidos!" },
  { pts: 35,  name: "Maestro Viajero",      icon: "🥈", color: "#cbd5e1", stroke: "#475569", desc: "¡Eres un maestro viajero!" },
  { pts: 50,  name: "Leyenda de España",    icon: "🥇", color: "#fcd34d", stroke: "#b45309", desc: "¡50 puntos! ¡Una leyenda!" },
  { pts: 75,  name: "Campeón Supremo",      icon: "🏆", color: "#c4b5fd", stroke: "#6d28d9", desc: "¡Campeón de geografía!" },
  { pts: 100, name: "Rey/Reina de España",  icon: "👑", color: "#fca5a5", stroke: "#b91c1c", desc: "¡El máximo honor del viajero!" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteStop = { raw: string; label: string; comm: Community | null; centroid: [number, number] };
type Phase = "building" | "trivia" | "victory";

// ─── Fact Popup ───────────────────────────────────────────────────────────────

function FactPopup({ name, onClose }: { name: string; onClose: () => void }) {
  const data = PROVINCE_DATA[name];
  const comm = getComm(name);
  const label = displayName(name);


  if (!data) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-40 pointer-events-none"
      style={{ transform: "translateX(-50%)", width: "min(440px, 92vw)" }}
    >
      <div
        className="rounded-3xl p-4 shadow-2xl border-4 pointer-events-auto relative"
        style={{ backgroundColor: comm?.fill ?? "#f3f4f6", borderColor: comm?.stroke ?? "#94a3b8" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 font-black text-base leading-none"
        >
          ✕
        </button>
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">{comm?.emoji ?? "📍"}</span>
          <div>
            <p className="font-black text-gray-800 text-base leading-tight" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
              {label}
            </p>
            <p className="text-sm font-semibold text-gray-700 mt-1 leading-snug" style={{ fontFamily: "'Nunito', sans-serif" }}>
              💡 {data.fact}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function RouteSidebar({ route, phase, onRemove, onStartAdventure, onReset }: {
  route: RouteStop[]; phase: Phase;
  onRemove: (raw: string) => void;
  onStartAdventure: () => void;
  onReset: () => void;
}) {
  return (
    <div className="w-full lg:w-64 flex flex-col gap-3 flex-shrink-0">
      <div className="bg-white rounded-3xl p-4 border-4 border-blue-400 shadow-xl flex flex-col">
        <h2 className="text-xl font-black text-blue-700 mb-3" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
          🗺️ Tu Ruta
        </h2>
        {route.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-4xl mb-2">👇</div>
            <p className="text-gray-400 text-sm font-semibold" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Toca provincias del mapa para crear tu ruta
            </p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 320 }}>
            {route.map((stop, i) => (
              <div key={stop.raw} className="flex items-center gap-2 px-3 py-2 rounded-2xl text-white font-bold text-sm"
                style={{ backgroundColor: stop.comm?.stroke ?? "#64748b" }}>
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ color: stop.comm?.stroke ?? "#64748b" }}>{i + 1}</span>
                <span>{stop.comm?.emoji ?? "📍"}</span>
                <span className="truncate flex-1" style={{ fontFamily: "'Nunito', sans-serif" }}>{stop.label}</span>
                {phase === "building" && (
                  <button onClick={() => onRemove(stop.raw)} className="text-white/60 hover:text-white text-xs flex-shrink-0">✕</button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 space-y-2">
          {route.length >= 2 && phase === "building" && (
            <button onClick={onStartAdventure}
              className="w-full py-3 rounded-2xl font-black text-white text-lg active:scale-95 transition-transform"
              style={{ fontFamily: "'Fredoka One', sans-serif", background: "linear-gradient(135deg,#f97316,#ef4444)", boxShadow: "0 5px 0 #c2410c" }}>
              🚀 ¡Empezar Aventura!
            </button>
          )}
          {route.length === 1 && phase === "building" && (
            <p className="text-center text-xs text-gray-400 font-semibold" style={{ fontFamily: "'Nunito', sans-serif" }}>
              ¡Añade al menos una más!
            </p>
          )}
          {route.length > 0 && phase === "building" && (
            <button onClick={onReset}
              className="w-full py-2 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 text-sm transition-colors"
              style={{ fontFamily: "'Nunito', sans-serif" }}>
              🔄 Borrar ruta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trivia Modal ─────────────────────────────────────────────────────────────

function TriviaModal({ stop, question, idx, total, score, onAnswer }: {
  stop: RouteStop; question: TriviaQ | null;
  idx: number; total: number; score: number;
  onAnswer: (ans: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const comm = stop.comm;

  useEffect(() => { setPicked(null); }, [idx]);

  if (!question) {
    useEffect(() => { setTimeout(() => onAnswer("__skip__"), 600); }, []);
    return null;
  }

  const handlePick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    setTimeout(() => onAnswer(opt), 1400);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full border-4 shadow-2xl"
        style={{ borderColor: comm?.stroke ?? "#6b7280" }}>
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="w-4 h-4 rounded-full transition-all"
              style={{ backgroundColor: i < idx ? "#16a34a" : i === idx ? comm?.stroke : "#e5e7eb", transform: i === idx ? "scale(1.3)" : "scale(1)" }} />
          ))}
        </div>
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">{comm?.emoji ?? "📍"}</div>
          <h3 className="text-2xl font-black" style={{ color: comm?.stroke, fontFamily: "'Fredoka One', sans-serif" }}>
            {stop.label}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Nunito', sans-serif" }}>
            {comm?.name} · Parada {idx + 1} de {total}
          </p>
        </div>
        <p className="text-lg font-black text-gray-800 text-center mb-5 leading-tight"
          style={{ fontFamily: "'Fredoka One', sans-serif" }}>
          {question.q}
        </p>
        <div className="space-y-3">
          {question.options.map((opt) => {
            const correct = opt === question.a;
            const isPicked = opt === picked;
            let cls = "border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400";
            if (picked) {
              if (correct) cls = "border-green-400 bg-green-100";
              else if (isPicked) cls = "border-red-400 bg-red-100";
              else cls = "border-gray-200 bg-gray-50 opacity-60";
            }
            return (
              <button key={opt} onClick={() => handlePick(opt)} disabled={!!picked}
                className={`w-full py-3 px-4 rounded-2xl border-2 font-bold text-gray-800 transition-all text-left flex justify-between items-center ${cls}`}
                style={{ fontFamily: "'Nunito', sans-serif" }}>
                <span>{opt}</span>
                {picked && correct && <span>✅</span>}
                {picked && isPicked && !correct && <span>❌</span>}
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
          ⭐ {score} {score === 1 ? "punto" : "puntos"} conseguidos
        </p>
      </div>
    </div>
  );
}

// ─── Victory ──────────────────────────────────────────────────────────────────

function VictoryScreen({ route, score, earnedPoints, totalPoints, onReset, onShowTrophies }: {
  route: RouteStop[]; score: number; earnedPoints: number;
  totalPoints: number; onReset: () => void; onShowTrophies: () => void;
}) {
  const total = route.length;
  const stars = total === 0 ? 1 : score / total === 1 ? 3 : score / total >= 0.6 ? 2 : 1;
  const newMedals = MEDALS.filter(m => m.pts <= totalPoints && m.pts > totalPoints - earnedPoints);
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "linear-gradient(135deg,#fde68a,#fb923c)" }}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center border-4 border-yellow-400 shadow-2xl">
        <div className="text-6xl mb-2">🎉</div>
        <h2 className="text-3xl font-black text-yellow-600 mb-1" style={{ fontFamily: "'Fredoka One',sans-serif" }}>
          ¡Aventura Completa!
        </h2>
        <p className="text-gray-500 text-sm mb-4" style={{ fontFamily: "'Nunito',sans-serif" }}>
          Visitaste {total} {total === 1 ? "provincia" : "provincias"} de España
        </p>

        {/* Score */}
        <div className="bg-yellow-50 rounded-2xl p-4 mb-3 border-2 border-yellow-200">
          <div className="text-4xl font-black text-yellow-500" style={{ fontFamily: "'Fredoka One',sans-serif" }}>
            {score}/{total}
          </div>
          <div className="text-yellow-600 font-bold text-sm mt-1" style={{ fontFamily: "'Nunito',sans-serif" }}>
            {score === total ? "¡Respuestas perfectas!" : score / total >= 0.6 ? "¡Muy bien hecho!" : "¡Sigue practicando!"}
          </div>
          <div className="flex justify-center gap-1 mt-1 text-2xl">
            {[1,2,3].map(s => <span key={s} style={{ opacity: s <= stars ? 1 : 0.25 }}>⭐</span>)}
          </div>
        </div>

        {/* Points earned */}
        <div className="bg-orange-50 rounded-2xl p-3 mb-3 border-2 border-orange-200 flex items-center justify-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <span className="text-2xl font-black text-orange-500" style={{ fontFamily: "'Fredoka One',sans-serif" }}>
              +{earnedPoints}
            </span>
            <span className="text-sm font-bold text-orange-400 ml-1" style={{ fontFamily: "'Nunito',sans-serif" }}>
              puntos · Total: {totalPoints}
            </span>
          </div>
        </div>

        {/* New medals unlocked */}
        {newMedals.length > 0 && (
          <div className="mb-3 p-3 rounded-2xl border-2 border-yellow-300 bg-yellow-50">
            <p className="text-xs font-black text-yellow-700 mb-2" style={{ fontFamily: "'Nunito',sans-serif" }}>
              🎊 ¡Medalla{newMedals.length > 1 ? "s" : ""} desbloqueada{newMedals.length > 1 ? "s" : ""}!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {newMedals.map(m => (
                <div key={m.name} className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: m.color, color: m.stroke, fontFamily: "'Nunito',sans-serif" }}>
                  {m.icon} {m.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button onClick={onShowTrophies}
            className="w-full py-3 rounded-2xl font-black text-white text-base active:scale-95 transition-transform"
            style={{ fontFamily: "'Fredoka One',sans-serif", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", boxShadow: "0 4px 0 #4c1d95" }}>
            🏆 Ver mis medallas
          </button>
          <button onClick={onReset}
            className="w-full py-3 rounded-2xl font-black text-white text-base active:scale-95 transition-transform"
            style={{ fontFamily: "'Fredoka One',sans-serif", background: "linear-gradient(135deg,#f97316,#ef4444)", boxShadow: "0 4px 0 #c2410c" }}>
            🚗 ¡Nueva Aventura!
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Map Layer ────────────────────────────────────────────────────────────────

function MapLayer({ route, onProvinceClick, canaryOnly }: {
  route: RouteStop[]; onProvinceClick: (geo: any) => void; canaryOnly?: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const routeNames = new Set(route.map(r => r.raw));

  const geoStyle = (geo: any) => {
    const name: string = geo.properties?.name ?? "";
    const comm = getComm(name);
    const inRoute = routeNames.has(name);
    return {
      default: { fill: inRoute ? (comm?.stroke ?? "#64748b") : (comm?.fill ?? "#d1fae5"), stroke: comm?.stroke ?? "#64748b", strokeWidth: inRoute ? 1.5 : 0.6, outline: "none" },
      hover: { fill: inRoute ? (comm?.stroke ?? "#64748b") : (comm?.hover ?? "#a7f3d0"), stroke: comm?.stroke ?? "#64748b", strokeWidth: 1.2, outline: "none", cursor: "pointer" },
      pressed: { fill: comm?.stroke ?? "#374151", outline: "none" },
    };
  };

  const proj = canaryOnly
    ? { center: [-15.6, 28.3] as [number, number], scale: 2800 }
    : { center: [-3.2, 40.3] as [number, number], scale: 3600 };

  const routeSegments = route.filter(s => canaryOnly ? CANARY_NAMES.has(s.raw) : !CANARY_NAMES.has(s.raw));

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={proj}
      width={canaryOnly ? 860 : 960}
      height={canaryOnly ? 130 : 620}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <Geographies geography={spainData}>
        {({ geographies }) =>
          geographies
            .filter(geo => canaryOnly ? isCanary(geo) : !isCanary(geo))
            .map(geo => (
              <Geography key={geo.rsmKey} geography={geo}
                onClick={() => onProvinceClick(geo)}
                onMouseEnter={() => setHovered(geo.properties?.name)}
                onMouseLeave={() => setHovered(null)}
                style={geoStyle(geo)} />
            ))
        }
      </Geographies>

      {routeSegments.length >= 2 && routeSegments.map((stop, i) => {
        if (i === 0) return null;
        const prev = routeSegments[i - 1];
        return (
          <Line key={`l${i}`} from={prev.centroid} to={stop.centroid}
            stroke="#f97316" strokeWidth={3.5} strokeDasharray="12 7" strokeLinecap="round"
            style={{ animation: "dashAnim 0.5s linear infinite" }} />
        );
      })}

      {routeSegments.map(stop => (
        <Marker key={stop.raw} coordinates={stop.centroid}>
          <circle r={12} fill="#f97316" stroke="white" strokeWidth={2.5} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={10} fill="white" fontWeight="bold"
            style={{ fontFamily: "'Nunito', sans-serif", pointerEvents: "none" }}>
            {route.indexOf(stop) + 1}
          </text>
        </Marker>
      ))}

      {routeSegments.length >= 1 && (() => {
        const last = routeSegments[routeSegments.length - 1];
        return (
          <Marker coordinates={last.centroid}>
            <text fontSize={18} textAnchor="middle" dominantBaseline="central" dy={-26}
              style={{ animation: "carBounce 0.9s ease-in-out infinite", pointerEvents: "none" }}>🚗</text>
          </Marker>
        );
      })()}

      {hovered && !routeNames.has(hovered) && PROVINCE_CENTROIDS[hovered] && (
        <Marker coordinates={PROVINCE_CENTROIDS[hovered]}>
          <rect x={-46} y={-16} width={92} height={20} rx={7} fill="rgba(17,24,39,0.82)" />
          <text textAnchor="middle" y={-3} fontSize={9} fill="white"
            style={{ fontFamily: "'Nunito', sans-serif", pointerEvents: "none", fontWeight: 700 }}>
            {displayName(hovered)}
          </text>
        </Marker>
      )}
    </ComposableMap>
  );
}

// ─── Trophy Panel ─────────────────────────────────────────────────────────────

function TrophyPanel({ totalPoints, onClose }: { totalPoints: number; onClose: () => void }) {
  const nextMedal = MEDALS.find(m => m.pts > totalPoints);
  const currentMedal = [...MEDALS].reverse().find(m => m.pts <= totalPoints);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border-4 border-yellow-400 overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relative p-5 pb-4 text-center"
          style={{ background: "linear-gradient(135deg,#fde68a,#fb923c)" }}>
          <button onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white font-black text-xl leading-none">
            ✕
          </button>
          <div className="text-5xl mb-1">🏆</div>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Fredoka One',sans-serif", textShadow: "2px 2px 0 rgba(0,0,0,0.2)" }}>
            Mis Logros
          </h2>
          {/* Total points */}
          <div className="mt-3 inline-flex items-center gap-2 bg-white/30 rounded-2xl px-4 py-2">
            <span className="text-2xl">⭐</span>
            <span className="text-3xl font-black text-white" style={{ fontFamily: "'Fredoka One',sans-serif" }}>{totalPoints}</span>
            <span className="text-sm font-bold text-white/80" style={{ fontFamily: "'Nunito',sans-serif" }}>
              {totalPoints === 1 ? "punto" : "puntos"} totales
            </span>
          </div>

          {/* Progress to next medal */}
          {nextMedal && (
            <div className="mt-3">
              <p className="text-xs font-bold text-white/80 mb-1" style={{ fontFamily: "'Nunito',sans-serif" }}>
                Próxima medalla: {nextMedal.icon} {nextMedal.name} ({nextMedal.pts - totalPoints} pts más)
              </p>
              <div className="h-2 rounded-full bg-white/30 overflow-hidden">
                <div className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${Math.min(100, (totalPoints / nextMedal.pts) * 100)}%` }} />
              </div>
            </div>
          )}
          {!nextMedal && (
            <p className="mt-2 text-sm font-black text-white" style={{ fontFamily: "'Nunito',sans-serif" }}>
              ¡Has conseguido todas las medallas! 🎉
            </p>
          )}
        </div>

        {/* Medals list */}
        <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 380 }}>
          {MEDALS.map(medal => {
            const unlocked = totalPoints >= medal.pts;
            return (
              <div key={medal.name}
                className="flex items-center gap-3 p-3 rounded-2xl border-2 transition-all"
                style={{
                  borderColor: unlocked ? medal.stroke : "#e5e7eb",
                  backgroundColor: unlocked ? medal.color + "55" : "#f9fafb",
                  opacity: unlocked ? 1 : 0.55,
                }}>
                <div className="text-3xl" style={{ filter: unlocked ? "none" : "grayscale(1)" }}>
                  {unlocked ? medal.icon : "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 text-sm leading-tight" style={{ fontFamily: "'Fredoka One',sans-serif" }}>
                    {medal.name}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ fontFamily: "'Nunito',sans-serif", color: unlocked ? medal.stroke : "#9ca3af" }}>
                    {unlocked ? medal.desc : `Consigue ${medal.pts} puntos para desbloquear`}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: unlocked ? medal.stroke : "#e5e7eb", color: unlocked ? "white" : "#9ca3af", fontFamily: "'Nunito',sans-serif" }}>
                    {medal.pts} ⭐
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const items = Object.values(COMMUNITIES).filter(c => !["Ceuta", "Melilla"].includes(c.name));
  return (
    <div className="mt-3 bg-white/70 backdrop-blur-sm rounded-2xl p-3">
      <p className="text-center text-xs font-bold text-gray-500 mb-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
        Comunidades Autónomas
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
        {items.map(c => (
          <div key={c.name} className="flex items-center gap-1 text-xs font-bold text-gray-700" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <span className="w-3 h-3 rounded-sm border inline-block flex-shrink-0" style={{ backgroundColor: c.fill, borderColor: c.stroke }} />
            {c.emoji} {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [route, setRoute] = useState<RouteStop[]>([]);
  const [phase, setPhase] = useState<Phase>("building");
  const [triviaIdx, setTriviaIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [routeQuestions, setRouteQuestions] = useState<(TriviaQ | null)[]>([]);
  const [factPopup, setFactPopup] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showTrophies, setShowTrophies] = useState(false);

  // Track which question index was last used per province — persists across routes
  const usedQIdx = useRef<Record<string, number>>({});

  const handleProvinceClick = useCallback((geo: any) => {
    if (phase !== "building") return;
    const name: string = geo.properties?.name ?? "";
    if (!name || name.includes("Gibraltar")) return;
    const centroid = PROVINCE_CENTROIDS[name];
    if (!centroid) return;
    const comm = getComm(name);
    const label = displayName(name);

    // Show fact popup
    setFactPopup(name);

    // Toggle in route
    setRoute(prev =>
      prev.some(s => s.raw === name)
        ? prev.filter(s => s.raw !== name)
        : [...prev, { raw: name, label, comm, centroid }]
    );
  }, [phase]);

  const startAdventure = () => {
    // Pick next question for each stop (rotating, no repeat from last time)
    const questions = route.map(stop => {
      const data = PROVINCE_DATA[stop.raw];
      if (!data || data.trivia.length === 0) return null;
      const lastIdx = usedQIdx.current[stop.raw] ?? -1;
      const nextIdx = (lastIdx + 1) % data.trivia.length;
      usedQIdx.current[stop.raw] = nextIdx;
      return data.trivia[nextIdx];
    });
    setRouteQuestions(questions);
    setPhase("trivia");
    setTriviaIdx(0);
    setScore(0);
    setFactPopup(null);
  };

  const handleAnswer = (ans: string) => {
    const q = routeQuestions[triviaIdx];
    const correct = q && ans !== "__skip__" && ans === q.a;
    if (correct) {
      setScore(s => s + 1);
      setTotalPoints(p => p + 1);
      setEarnedPoints(e => e + 1);
    }
    if (triviaIdx + 1 >= route.length) setPhase("victory");
    else setTriviaIdx(i => i + 1);
  };

  const reset = () => {
    setRoute([]);
    setPhase("building");
    setScore(0);
    setTriviaIdx(0);
    setRouteQuestions([]);
    setFactPopup(null);
    setEarnedPoints(0);
    // totalPoints intentionally NOT reset — accumulates across routes
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-4 overflow-x-hidden"
      style={{ fontFamily: "'Fredoka One','Nunito',sans-serif", background: "linear-gradient(160deg,#38bdf8 0%,#0ea5e9 50%,#0284c7 100%)" }}>

      {/* Nubes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[["5%","0s","2.2rem"],["14%","9s","3rem"],["6%","18s","1.8rem"],["21%","4s","2.6rem"]].map(([top,delay,size],i) => (
          <div key={i} className="absolute text-white/30 select-none"
            style={{ top, fontSize: size, left:"-150px", animation:`cloudDrift ${24+i*6}s linear ${delay} infinite` }}>
            ☁️
          </div>
        ))}
      </div>

      {/* Cabecera */}
      <header className="w-full max-w-7xl mb-3 relative z-10 flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-none"
            style={{ fontFamily:"'Fredoka One',sans-serif", textShadow:"3px 3px 0 #075985,6px 6px 0 rgba(7,89,133,0.3)" }}>
            🗺️ ¡Viaje por España! 🚗
          </h1>
          <p className="text-white/90 font-bold mt-1 text-sm sm:text-base"
            style={{ textShadow:"1px 1px 2px rgba(0,0,0,0.3)", fontFamily:"'Nunito',sans-serif" }}>
            Toca las provincias para descubrir sus secretos y planear tu ruta
          </p>
        </div>

        {/* Puntos acumulados */}
        <button
          onClick={() => setShowTrophies(true)}
          className="flex-shrink-0 flex flex-col items-center gap-0.5 bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-2xl px-3 py-2 border-2 border-white/40"
        >
          <span className="text-2xl leading-none">🏆</span>
          <span className="text-xl font-black text-white leading-none" style={{ fontFamily:"'Fredoka One',sans-serif" }}>
            {totalPoints}
          </span>
          <span className="text-[10px] font-bold text-white/80 leading-none" style={{ fontFamily:"'Nunito',sans-serif" }}>
            pts
          </span>
        </button>
      </header>

      {/* Contenido */}
      <div className="flex flex-col lg:flex-row gap-3 w-full max-w-7xl relative z-10 items-start">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white rounded-t-3xl shadow-2xl border-4 border-b-0 border-yellow-400 overflow-hidden">
            <MapLayer route={route} onProvinceClick={handleProvinceClick} />
          </div>
          <div className="bg-sky-50 border-4 border-t-2 border-yellow-400 rounded-b-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center px-4 py-1 border-b border-sky-200">
              <span className="text-xs font-black text-sky-600" style={{ fontFamily:"'Nunito',sans-serif" }}>🌋 Islas Canarias</span>
              <span className="ml-2 text-[10px] text-sky-400 font-semibold" style={{ fontFamily:"'Nunito',sans-serif" }}>(toca para añadir a la ruta)</span>
            </div>
            <MapLayer route={route} onProvinceClick={handleProvinceClick} canaryOnly />
          </div>
          <Legend />
        </div>

        <RouteSidebar route={route} phase={phase}
          onRemove={raw => setRoute(r => r.filter(s => s.raw !== raw))}
          onStartAdventure={startAdventure}
          onReset={reset} />
      </div>

      {/* Fact popup */}
      {factPopup && (
        <FactPopup name={factPopup} onClose={() => setFactPopup(null)} />
      )}

      {/* Trivia */}
      {phase === "trivia" && route[triviaIdx] && (
        <TriviaModal
          stop={route[triviaIdx]}
          question={routeQuestions[triviaIdx] ?? null}
          idx={triviaIdx} total={route.length} score={score}
          onAnswer={handleAnswer} />
      )}

      {phase === "victory" && (
        <VictoryScreen route={route} score={score} earnedPoints={earnedPoints}
          totalPoints={totalPoints} onReset={reset} onShowTrophies={() => setShowTrophies(true)} />
      )}

      {showTrophies && (
        <TrophyPanel totalPoints={totalPoints} onClose={() => setShowTrophies(false)} />
      )}

      <style>{`
        @keyframes cloudDrift { 0% { left:-150px } 100% { left:110% } }
        @keyframes dashAnim { 0% { stroke-dashoffset:0 } 100% { stroke-dashoffset:-19 } }
        @keyframes carBounce { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-4px) } }
        @keyframes shrink { 0% { width:100% } 100% { width:0% } }
      `}</style>
    </div>
  );
}
