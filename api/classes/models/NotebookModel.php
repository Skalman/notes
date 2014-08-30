<?php

require_once __DIR__ . '/storage.php';

class NotebookModel
{
	public $data;
	public $revision;
	public $email;

	public function __construct()
	{
		$this->data = null;
		$this->revision = null;
		$this->email = null;
	}

	private function throwDbException($mysqli)
	{
		throw new ApiException("Database error: ({$mysqli->errno}) {$mysqli->error}", 'db_error');
	}

	public function load()
	{
		$mysqli = get_mysqli();

		$record = mysqli_query_to_array($mysqli,
			'SELECT n.revision, n.content, n.format
			FROM notebooks n
			JOIN users u ON n.user_id = u.id
			WHERE u.email = {email}',
			array(
				'email' => $this->email,
			));

		if ($record === false)
			$this->throwDbException($mysqli);

		if (!$record) {
			$this->data = null;
			return;
		}

		$record = $record[0];

		switch ($record['format']) {
			case 'json':
				$this->data = json_decode($record['content'], true);
				break;

			default:
				throw new ApiException("Unknown format '$record[format]'", 'internal_error');
		}
		$this->revision = $record['revision'];
	}

	public function save()
	{
		$mysqli = get_mysqli();
		$new_revision = base64_encode(openssl_random_pseudo_bytes(30));

		if ($this->revision === null) {
			// Create a new notebook.

			// Get the user ID.
			$user_id = mysqli_query_to_array($mysqli,
				"SELECT id
				FROM users
				WHERE email = {email}",
				array(
					'email' => $this->email,
				));

			if ($user_id === false)
				$this->throwDbException($mysqli);

			if (!count($user_id)) {
				// Create a user.
				$result = mysqli_query_sprintf($mysqli,
					"INSERT INTO users (email)
					VALUES ({email})",
					array(
						'email' => $this->email,
					));

				if ($result === false)
					$this->throwDbException($mysqli);

				$user_id = $mysqli->insert_id;
			} else {
				$user_id = $user_id[0]['id'];
			}

			// Create a notebook.
			$result = mysqli_query_sprintf($mysqli,
				"INSERT INTO notebooks (user_id, revision, content, format)
				VALUES ({user_id}, {new_revision}, {content}, 'json')",
				array(
					'user_id' => $user_id,
					'new_revision' => $new_revision,
					'content' => json_encode($this->data),
				));

			if ($result === false)
				$this->throwDbException($mysqli);

		} else {
			$result = mysqli_query_sprintf($mysqli,
				"UPDATE notebooks n
				JOIN users u ON n.user_id = u.id
				SET n.revision = {new_revision}, n.content = {content}, n.format = 'json'
				WHERE u.email = {email} AND n.revision = {old_revision}",
				array(
					'email' => $this->email,
					'old_revision' => $this->revision,
					'new_revision' => $new_revision,
					'content' => json_encode($this->data),
				));

			if ($result === false)
				$this->throwDbException($mysqli);

			if ($mysqli->affected_rows === 0) {
				// Get revision.
				$revision = mysqli_query_to_array($mysqli,
					"SELECT n.revision
					FROM users u
					LEFT JOIN notebooks n ON n.user_id = u.id
					WHERE u.email = {email}"
				);

				if ($revision === false)
					$this->throwDbException($mysqli);

				if (!count($revision))
					throw new ApiException('Cannot save notebook, because the account does not exist', 'no_account');
				elseif ($revision[0]['revision'] === null)
					throw new ApiException('Cannot save notebook, because it does not exist (did somebody delete it?)', 'missing_notebook');
				else
					throw new ApiException('Edit conflict or revision mismatch', 'edit_conflict', array(
						'revision' => $revision[0]['revision'],
					));
			}
		}

		$this->revision = $new_revision;
	}
}
