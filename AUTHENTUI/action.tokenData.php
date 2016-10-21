<?php
function tokenData(Action & $action)
{
    $usage = new ActionUsage($action);
    //$search = $usage->addOptionalParameter("search", "search filters");
    $columns = $usage->addOptionalParameter("columns", "columns description");
    $start = $usage->addOptionalParameter("start", "columns description");
    $length = $usage->addOptionalParameter("length", "columns description");
    $showExpired = ($usage->addOptionalParameter("showExpired", "view expire", array("true","false"), "true")==="true");
    
    $err = "";
    $data = [];

    $expendableTrue=___("Once", "accesstoken");
    $expendableFalse=___("Multiple", "accesstoken");
    $q = new QueryDb($action->dbaccess, "UserToken");
    if (! $showExpired) {
        $q->addQuery("expire > now()");
    }

    $q->order_by = "cdate desc nulls last, expire, userid, token";
    foreach ($columns as $col) {
        $colName = $col["data"];
        if ($col["searchable"] === "true") {
            $col["search"]["value"]=trim($col["search"]["value"]);
            if (!empty($col["search"]["value"])) {
                if ($colName === "user") {
                    simpleQuery($action->dbaccess, sprintf("select id from users where login ~ '%s'", pg_escape_string($col["search"]["value"])) , $userIds, true, false);
                    if ($userIds) {
                        $q->addQuery(
                            sprintf("userid in (%s)", implode(",", $userIds))
                        );
                    } else {
                        $q->addQuery("false");
                    }
                } else if ($colName === "expendable") {
                    if (strtolower($col["search"]["value"][0]) === strtolower($expendableTrue[0])) {
                        $q->addQuery(sprintf("%s", $colName));
                    } elseif (strtolower($col["search"]["value"][0]) === strtolower($expendableFalse[0])) {
                        $q->addQuery(sprintf("(not %s or %s is null)", $colName, $colName));
                    }
                } else {
                    $q->addQuery(sprintf("%s::text ~ '%s'", $colName, pg_escape_string($col["search"]["value"])));
                }
            }
        }
    }
    
    $userids = [];
    $tokenData = $q->Query($start, $length, "TABLE");

    if ($q->nb > 0) {
        foreach ($tokenData as $tokenRow) {
            $userids[] = intval($tokenRow["userid"]);
            $context = unserialize($tokenRow["context"]);
            if (is_array($context)) {
                $tContext = [];
                ksort($context);
                foreach ($context as $k => $v) {
                    $tContext[] = sprintf("<span><b>%s</b>&nbsp;:&nbsp;<i>%s</i></span>", $k, $v);
                }
                $scontext = implode(", ", $tContext);
            } else {
                $scontext = $tokenRow["context"];
            }
            
            $data[] = ["token" => $tokenRow["token"], "description"=>$tokenRow["description"], "userid" => $tokenRow["userid"], "expire" => $tokenRow["expire"], "context" => $scontext, "expendable" => ($tokenRow["expendable"]) ? $expendableTrue : $expendableFalse, "button" => "<a/>"];
        }
        simpleQuery($action->dbaccess, sprintf("select id, login from users where id in (%s)", implode(",", array_unique($userids))) , $usersData);
        $userLogin = [];
        foreach ($usersData as $userRow) {
            $userLogin[$userRow["id"]] = $userRow["login"];
        }
        $now = date("Y-m-d H:i:s");
        foreach ($data as & $row) {
            $row["user"] = empty($userLogin[$row["userid"]])?"INVALID ".$row["userid"]:$userLogin[$row["userid"]];
            $row["hasExpired"] = ($row["expire"] < $now);
        }
    }
    
    header('Content-Type: application/json');
    
    if ($err) {
        header("HTTP/1.0 400 Error");
        $response = ["success" => false, "error" => $err];
    } else {

        if ($showExpired) {
            simpleQuery(
                $action->dbaccess, "select count(*) from usertoken", $total,
                true, true
            );
        } else {
            simpleQuery(
                $action->dbaccess, "select count(*) from usertoken where expire > now()", $total,
                true, true
            );
        }
        simpleQuery(
            $action->dbaccess, "select count(*) from usertoken where expire < now()", $totalExpire,
            true, true
        );
        $all = $q->Query(0, 0, "TABLE");
        if ($q->nb === 0) {
            $all = [];
        }
        $response = ["recordsTotal" => intval($total) , "recordsFiltered" => count($all) , "expireCount"=>intval($totalExpire) ,
        "data" => $data];
    }
    $action->lay->noparse = true;
    $action->lay->template = json_encode($response);
}
