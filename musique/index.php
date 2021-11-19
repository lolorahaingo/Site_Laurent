<?php
# @Author: rahaingomanana <laurent>
// # @Date:   2019-11-11T19:12:55+01:00
// # @Email:  laurent.rahaingomanana@estaca.eu
// # @Filename: index.php
# @Last modified by:   laurent
# @Last modified time: 2020-09-22T12:26:43+02:00


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
    <meta name="description" content="liste des différentes musiques jouées par Laurent Rahaingo">
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

	<div class="text">
		<p>
            Les enregistrements seront disponibles quand j'aurai un assez bon micro.
            <iframe src="https://calendar.google.com/calendar/embed?src=18sunk42ga6ra2ko74tng1n8sl351u1c%40import.calendar.google.com&ctz=Europe%2FParis" style="border: 0" width="800" height="600" frameborder="0" scrolling="no"></iframe>
        </p>
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
