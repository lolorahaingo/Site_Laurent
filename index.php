<?php
# @Author: rahaingomanana <laurent>
# @Date:   2019-10-19T23:54:22+02:00
# @Email:  laurent.rahaingomanana@estaca.eu
# @Filename: index.php
# @Last modified by:   laurent
# @Last modified time: 2021-05-17T11:42:48+02:00
?>

<!DOCTYPE html>
<html lang="fr" dir="ltr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Menu du site de Laurent Rahaingo avec sa présentation,
    les différents projets, de la musique et de la domotique">
	<link rel="stylesheet" type="text/css" href="style.scss">
    <title>Laurent Rahaingo</title>
  </head>
  <body><img class="bgnd" src="images/snow.jpg" alt="photo d'arbres enneigés">

	<nav class="navigation">
	  	<a href="#contact" >Contact</a>
		<ul>
		<li class="navigation__item"><a href="index.php">Menu</a></li>
		<li class="navigation__item"><a href="#domotique" >Domotique</a></li>
        <li class="navigation__item"><a href="#projets" >Projets réalisés</a></li>
		<li class="navigation__item"><a href="#musique">Musique</a></li>
		</ul>
    </nav>
	<div id="presentation">
		<div class="text">
			<h4>À propos du Créateur,</h4>
			<p>Cliquez sur "Voir" pour télécharger le CV de</br>Laurent Rahaingo</p>
			<a href="./documents/CV – 2A – Rahaingomanana.pdf" download>Voir</a>
		</div>
		<img src="images/bretagne.jpg" alt="photo de bretagne">
	</div>
	<div id="domotique" class="section">
		<div class=text>
			<h2>Domotique</h2></br><p>Innover, trouver des solutions, créer, sont des aspects de l'informatique
			que j'affectionne particulièrement. J'ai commencé l'informatique au lycée
			et après plusieurs projets, un de mes projets les plus ambitieux est celui-ci...
			Le but de mon projet de domotique est de pouvoir contrôler ma maisons (capteurs, alarmes, chauffage...)
			à distance à partir de ce serveur qui héberge mon site.</p>
		</div>
		<div class="img">
			<img src="./images/code.png" alt="photo de code informatique">
			<div class=text>
				<p>Cliquez sur "Voir" pour voir le projet domotique</p></br>
				<a href="domotique/index.php">Voir</a>
			</div>
		</div>
	</div>
    <div id="projets" class="section">
		<div class="img">
			<img src="./images/walker.png" alt="photo du walker">
			<div class=text>
				<p>Cliquez sur "Voir" pour voir les projets réalisés</p></br>
				<a href="projets/index.php">Voir</a>
			</div>
		</div>
        <div class=text>
			<h2>Projets réalisés</h2></br><p>Voici quelques projets que j'ai pu réaliser. Ces projets m'ont permis
            de découvrir et de m'améliorer dans l'informatique. Ils utilisent tous la arduino car cette carte me permet
            de contrôler des moteurs, des servomoteurs, des capteurs, des transistors,... elle est le cerveau de mes projets</p>
		</div>
	</div>
    <div id="musique" class="section">
        <div class=text>
			<h2>Musique</h2></br><p>La harpe est très utilisée
		 	dans les orchestres. Elle est de plus en plus utilisée en solo et on peut écouter des retranscriptions de plusieurs
            styles: classique, jazz, rock...
			C'est l'instrument que j'ai choisi de pratiquer à 8 ans. Mon style préféré à la harpe reste la musique classique.
			Vous trouverez sur ce site quelques enregistrements des morceaux que j'ai pu enregistrer.
			Je vous souhaite une bonne écoute !</p>
		</div>
		<div class="img">
			<img src="./images/harpe.jpg" alt="phot d'une harpe">
			<div class=text>
				<p>Cliquez sur "Voir" pour voir les enregistrements</p></br>
				<a href="./musique/index.php">Voir</a>
			</div>
		</div>
	</div>

	<footer id="contact">
		<div class="socials">
			<a href="mailto:laurent.rahaingomanana@estaca.eu" aria-label="envoie un mail"><img src="images/mail.png" alt="logo mail"></a>
			<a href="https://linkedin.com/in/laurent-rahaingomanana-64106210b"><img src="images/linkedin.png" alt="logo Linkedin"></a>
		</div>
	</br><p id="bottom">Designed with Laurent Rahaingo       -       © 2021 All rights reserved</p>
	</footer>
</body>
</html>
