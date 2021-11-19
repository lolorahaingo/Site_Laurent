<?php
# @Author: rahaingomanana <laurent>
// # @Date:   2019-11-11T19:12:55+01:00
// # @Email:  laurent.rahaingomanana@estaca.eu
// # @Filename: index.php
# @Last modified by:   laurent
# @Last modified time: 2020-09-12T17:29:18+02:00


function get_state($pin)
{
    //DEMANDE à ARDUINO ETAT
    return shell_exec("get_state.py \"".$pin."\"");
    //RETOURNE REPONSE ARDUINO
}
function set_state($pin)
{
    shell_exec("set_state.py \"".$pin."\"");
}
class Machine
{
	private $pin;
	private $state;
	private $mode;

	public function __construct($pin, $state, $mode)
	{
		$this->pin = $pin;
		$this->state = $state;
		$this->mode = $mode;
	}
	public function get_state()
	{
		return $this->state;
	}
	public function get_pin()
	{
		return $this->pin;
	}
    public function set_pin($pin)
    {
        $this->pin = $pin;
    }
    public function set_state($state)
    {
        $this->state = $state;
    }
	// public function change_state()
	// {
		// exec("write_on_serial.py \"hello world\"");
		// if($this->state == "off") //MODIF DU JSON
		// 	$this->state = "on";
		// else
		// 	$this->state = "off";
	// }
}

$relai_1 = new Machine("3", "", "OUTPUT");
$relai_1->set_state(get_state($relai_1->get_pin()));
$thermistor_1 = new Machine("A0", "", "INPUT");
$thermistor_1->set_state(get_state($thermistor_1->get_pin()));

// $url = '../machines.json';
// $data = file_get_contents($url);
// while(!($machines = json_decode($data))) //POUR EVITER QUE LE FICHIER SOIT DEJA OUVERT, ON ATTENT QUE LE PRECEDENT SOIT FERME
// 	$data = file_get_contents($url);
//
// foreach ($machines as $machine)
// 	${$machine->name} = new Machine($machine->pin, $machine->state, $machine->type);
//
// foreach ($machines as $machine)
// 	if(isset($_GET[$machine->name]) && htmlentities($_GET[$machine->name]) == "change")
// 		${$machine->name}->change_state();
//
// foreach ($machines as $machine)
// 	$machine->state = ${$machine->name}->get_state();
//
//
// while(!($json = json_encode($machines))); //POUR EVITER QUE LE FICHIER SOIT DEJA OUVERT, ON ATTENT QUE LE PRECEDENT SOIT FERME
// file_put_contents('../machines.json', $json);

?>

<!DOCTYPE html>
<html lang="fr" dir="ltr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="explicaton de la domotique envisagée">
	<link rel="stylesheet" type="text/css" href="style.scss">
    <title>Laurent Rahaingo</title>
  </head>
  <body><img class="bgnd" src="../images/snow.jpg">

	<nav class="navigation">
	  	<a href="#contact" >Contact</a>
		<ul>
		<li class="navigation__item"><a href="../index.php">Menu</a></li>
		<li class="navigation__item"><a href="../index.php#domotique" >Domotique</a></li>
        <li class="navigation__item"><a href="../index.php#projets" >Projets réalisés</a></li>
		<li class="navigation__item"><a href="../index.php#musique">Musique</a></li>
		</ul>
    </nav>
    <div id="creation_site">
		<div class="text">
			<h4>Création de mon site</h4>
			<p>
                Un site web est un code interprété par un navigateur web (opera, safari, chrome,…). Ce code est
                récupéré par votre ordinateur à partir d’un serveur : c’est une machine distante qui
                stocke tous les fichiers nécessaires à la création d’une page web.
                Le premier objectif de ce projet était de réussir à créer un serveur web avec la Raspberry Pi.
                Grâce à ce mini-ordinateur je pourrai contrôler plein de chose dans ma maison !
                Son avantage est qu’il est petit, pas cher et qu’il possède des ports usb et un gpio auxquels
                on peut brancher un tas d’appareil électroniques (caméra, interrupteurs commandés,…),
                d’où son intérêt dans ce projet de domotique.
            </p>
		</div>
		<img src="../images/raspberrypi.png" alt="photo d'un Raspberry Pi">
        <div class="text">
			<p>
                Quand vous tapez un nom dans l’url de votre navigateur, c’est en fait
                l’adresse d’un serveur que vous tapez. Ce nom de domaine est traduit en « adresse ip »
                par l’intermédiaire d’un serveur intermédiaire appelé DNS. La première étape est donc
                de créer un nom de domaine pour qu’il soit redirigé vers le serveur de la Raspberry Pi.
                Pour ce faire j’ai payé un abonnement annuel de Google Domain qui redirige le nom laurentrahaingo.fr
                vers l’adresse ip de mon serveur (si vous tapez l’adresse de mon serveur vous tomberez sur
                la même page… essayez avec 89.159.0.250).
            </p>
            <p>
                Une fois cela fait, il faut configurer le serveur. La box est la passerelle entre le client
                et le serveur. Chaque page web que vous visitez passe par cette box. Par défaut vous ne pouvez
                que demander des pages web, c’est-à-dire que vous ne faites que questionner le web.
                Il n’y a aucune connexion entrante dans votre réseau local. Or, nous voulons que les utilisateurs
                du monde entier puissent atteindre notre Raspberry Pi qui est dans notre réseau local pour que cette
                dernière puisse livrer les fichiers codant notre site web au client. Il faut donc configurer
                notre box pour qu’elle accepte des connexions extérieures et les redirige vers la Raspberry Pi.

            </p>
		</div>
	</div>
    <div id="premieres_exp">
		<div class="text">
			<h4>Premières expériences</h4>
			<p>
                Le site créé, il faut maintenant réussir à faire interagir les
                clients avec des machines branchées au Raspberry Pi. Pour mes premiers tests
                j’ai donc utilisé des LED par l’intermédiaire d’un Arduino (autre contrôleur).
                Le défi est de pouvoir les allumer de n’importe où dans le monde…
            </p>
		</div>
		<img src="../images/relai.png" alt="photo d'un relai branché à une arduino">
        <div class="text">
			<p>
                En rajoutant un bouton sur une page web de mon site on peut lancer un programme
                sur ma Raspberry Pi qui donne l’ordre à la Arduino d’éteindre ou d’allumer les LED.
                J’ai réussi à le coder et ce premier test a fonctionné ! J’ai ensuite rajouté des relais qui
                s’ouvrent ou se ferme en fonction du bouton appuyé sur le site… Ça ne change pas grand-chose à
                la logique algorithmique mais c’est tellement fun !
            </p>
            <p>
                Pour l’instant, pas de grandes avancées, je n’ai pas encore poursuivi
                ce projet, me lançant dans d’autres projet à droite, à gauche…
            </p>
		</div>
	</div>

	<footer id="contact">
		<div class="socials">
			<a href="mailto:laurent.rahaingomanana@estaca.eu"><img src="../images/mail.png" alt="Logo mail"></a>
			<a href="https://linkedin.com/in/laurent-rahaingomanana-64106210b"><img src="../images/linkedin.png" alt="Linkedin"></a>
		</div>
	</br><p id="bottom">Designed with Laurent Rahaingo       -       © 2020 All rights reserved</p>
	</footer>
</body>
</html>
