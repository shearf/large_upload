<?php
$post_data = file_get_contents('php://input');


$file_name = substr($_GET['file_name'], 0, strrpos($_GET['file_name'], '.'));
$file_ext = substr($_GET['file_name'], strrpos($_GET['file_name'], '.'));
$file_size = $_GET['file_size'];

define('FILE_PATH_PHY', dirname(__FILE__) . DIRECTORY_SEPARATOR . 'files' . DIRECTORY_SEPARATOR);
define('FILE_PATH', 'files' . DIRECTORY_SEPARATOR);

$cookie_name = md5($file_name);					//防止中文乱码
$tmp_file = $_COOKIE[$cookie_name];

$target_file_dir = FILE_PATH_PHY . date('Ymd') . DIRECTORY_SEPARATOR;
if (!is_dir($target_file_dir)) {
	mkdir($target_file_dir, 0777, true);
}

if (empty($tmp_file)) {
	
	$tmp_file = $target_file_dir . createRandFileName() . '.tmp';
	
	setcookie($cookie_name, $tmp_file, time() + 24 * 3600);
}

//获得本地已经保存的临时文件的大小
$send = 0;
if (file_exists($tmp_file)) {
	$send = filesize($tmp_file);
}

if ($post_data) {		//如果有上传的二进制流，则拼接文件
	$file = fopen($tmp_file, 'ab');
	$send += fwrite($file, $post_data);
	fclose($file);
}

$tmp_file_name = substr($tmp_file, strrpos($tmp_file, DIRECTORY_SEPARATOR) + 1);

if ($file_size == $send) {		//文件大小相等，所以已经上传完毕
	$tmp_file_name = substr($tmp_file_name, 0, strrpos($tmp_file_name, '.'));
	rename($tmp_file, $target_file_dir . $tmp_file_name . $file_ext);
	$tmp_path = FILE_PATH . $tmp_file_name . $file_ext;
	
	setcookie($cookie_name, '', time() - 3600);
}
else {
	$tmp_path = FILE_PATH . $tmp_file_name;
}

echo json_encode(array(
	'statusCode' 	=> 200,
	'tmp' 			=> $tmp_path,
	'send' 			=> $send 
));


function createRandFileName($len = 16) {
	$rand_key = '0123456789_qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
	$max = strlen($rand_key);
	$name = '';
	while ($len-- > 0) {
		$name .= substr($rand_key, rand(0, $max), 1);
	}
	
	return $name;
}
