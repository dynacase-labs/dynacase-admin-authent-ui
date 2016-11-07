<?php
function actionlist(Action & $action)
{
    $return = array(
        "success" => true,
        "error" => array() ,
        "body" => array()
    );
    try {
        $appId = $action->parent->id;
        if (!is_numeric($appId)) {
            throw new Exception(sprintf("unexpected application id: %s", var_export($appId, true)));
        }

        $appName = $action->parent->name;
        $body = array();
        $adminActions = array();

        $query = <<< "SQL"
SELECT
    action.name,
    action.short_name,
    action.long_name,
    application.name as appname,
    application.id as appid
    
FROM action, application
WHERE
    action.toc = 'Y'
    AND action.id_application = application.id
    AND application.tag ~ 'AUTHENT'
ORDER BY action.toc_order
;
SQL;


        simpleQuery('', $query, $adminActions, false, false, true);
        foreach ($adminActions as $adminAction) {
            $appName=$adminAction["appname"];
            $appId=$adminAction["appid"];
            if (!$action->canExecute($adminAction["name"], $appId)) {
                $actionUrl = "?app=$appName&action=" . $adminAction["name"];

                $body[] = array(
                    "url" => $actionUrl,
                    "label" => $action->text($adminAction['short_name']) ,
                    "title" => (empty($adminAction["long_name"]) ? $action->text($adminAction['short_name']) : $action->text($adminAction['long_name']))
                );
            }
        }

        $return["body"] = $body;
    }
    catch(Exception $e) {
        $return["success"] = false;
        $return["error"][] = $e->getMessage();
        unset($return["body"]);
    }

    $action->lay->template = json_encode($return);
    $action->lay->noparse = true;
    header('Content-type: application/json');
}
