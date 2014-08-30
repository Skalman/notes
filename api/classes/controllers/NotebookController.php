<?php
/**
 * Notebook controller.
 *
 * @package api-framework
 */
class NotebookController extends AbstractController
{
	private function getNotebook() {
		$accountsController = new AccountsController();
		$account = $accountsController->GET_account();

		$notebook = new NotebookModel();
		$notebook->email = $account['email'];
		$notebook->load();

		return $notebook;
	}

	/**
	 * GET method.
	 *
	 * @param  Request $request
	 */
	public function GET($request)
	{
		$notebook = $this->getNotebook();

		if ($notebook->data === null) {
			$notebook->data = array(
				'name' => 'My Notebook',
				'activeSection' => 0,
				'sections' => array(array(
					'name' => 'New section',
					'color' => '#e87d7d',
					'activePage' => 0,
					'pages' => array(array(
						'name' => 'New page',
						'items' => array(array(
							'x' => 2,
							'y' => 4,
							'html' => 'Write something here',
						)),
					)),
				)),
			);
		}

		return array(
			'revision' => $notebook->revision,
			'notebook' => $notebook->data,
		);
	}

	/**
	 * PUT action.
	 *
	 * @param  $request
	 * @return null
	 */
	public function PUT($request)
	{
		$this->assertParameter($request, 'notebook');

		$notebook = $this->getNotebook();

		if ((string)$notebook->revision !== (string)@$request->parameters['revision']) {
			if ($notebook->revision === null) {
				throw new ApiException("Unexpected parameter 'revision'. No previous version.", 'edit_conflict', array(
					'revision' => $notebook->revision,
				));
			} elseif (!isset($request->parameters['revision'])) {
				throw new MissingParameterException('revision');
			} else {
				throw new ApiException("Edit conflict.", 'edit_conflict', array(
					'revision' => $notebook->revision,
				));
			}
		}

		$newData = json_decode($request->parameters['notebook']);

		if ($newData === null) {
			throw new ApiException("Cannot decode JSON of parameter 'notebook'", 'bad_json', array(
				'php_json_error_code' => json_last_error(),
				'params' => $request->parameters['notebook'],
			));
		}


		$notebook->data = $newData;
		$notebook->save();

		return array(
			'revision' => $notebook->revision,
		);
	}
}
