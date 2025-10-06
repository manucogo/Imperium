<?php
$password = "imperium25";
$hash = password_hash($password, PASSWORD_DEFAULT);
echo $hash;
?>