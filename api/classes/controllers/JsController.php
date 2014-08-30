<?php

class JsController extends AbstractController
{
	public function GET_persona($request)
	{
		$content = false;
		$file = __DIR__ . '/../../cache/login.persona.org-include.js';
		$source = 'https://login.persona.org/include.js';

		$exists = file_exists($file);
		if (!$exists || @filemtime($file) + 24*60*60 < time()) {
			$content = @file_get_contents($source);
			if ($content) {
				file_put_contents($file, $content);
				chmod($file, 0666);
			}
		}

		header('Content-Type: text/javascript');
		if ($content)
			echo $content;
		elseif ($exists)
			readfile($file);
		else
			header("Location: $source");
		exit;
	}
}
