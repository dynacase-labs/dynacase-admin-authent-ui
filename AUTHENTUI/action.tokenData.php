<?php
function tokenData(Action & $action)
{
    $usage = new ActionUsage($action);
    //$search = $usage->addOptionalParameter("search", "search filters");
    $columns = $usage->addOptionalParameter("columns", "columns description");
    $start = $usage->addOptionalParameter("start", "columns description");
    $length = $usage->addOptionalParameter("length", "columns description");
    $showExpired = ($usage->addOptionalParameter("showExpired", "view expire", array(
        "true",
        "false"
    ) , "true") === "true");
    
    try {
        $tokenList = new \Dcp\Authent\tokenData();
        $tokenList->setStart($start);
        $tokenList->setLength($length);
        $tokenList->setColumns($columns);
        $tokenList->setShowExpired($showExpired);
        
        $tokenData = $tokenList->getRawData();
        
        $data = $tokenList->getDisplayData($tokenData);
        $total = $tokenList->getShowTotal();
        $totalExpire = $tokenList->getTotalExpire();
        $all = $tokenList->getTotalCount();
        $response = ["recordsTotal" => intval($total) , "recordsFiltered" => $all, "expireCount" => intval($totalExpire) , "data" => $data];
    }
    catch(Exception $e) {
        $err = $e->getMessage();
        header("HTTP/1.0 400 Error");
        $response = ["success" => false, "error" => $err];
    }
    header('Content-Type: application/json');
    
    $action->lay->noparse = true;
    $action->lay->template = json_encode($response);
}
