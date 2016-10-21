<?php
require_once ("FDL/Class.Doc.php");
function tokenUserdata(Action & $action)
{

    $usage = new ActionUsage($action);
    $usage->setDefinitionText("Get user list");

    $term = trim($usage->addOptionalParameter("term", "Filter term"));
    $usage->setStrictMode(false);
    $usage->verify();
$err='';
    $us=new SearchAccount();
    $us->setTypeFilter(SearchAccount::userType);
    if ($term) {
        $term=preg_quote(mb_strtolower($term));
        $us->addFilter("login ~ '%s' or lastname ~* '%s' or firstname ~* '%s' ", $term, $term, $term);
    }
    $us->setSlice(50);
    $users=$us->search();
    $data=[];
    foreach ($users as $user) {
        $data[] = ["id" => $user->login,
            "label" => sprintf("%s (%s %s)",$user->login, $user->firstname, $user->lastname) ,
            "value" => $user->login];
    }

    if (!$data) {
         $data[] = ["id" => 0,
            "label" => sprintf(___("No user match %s", "accesstoken"),$term) ,
            "value" => "-"];
    }


    header('Content-Type: application/json');

    if ($err) {
        header("HTTP/1.0 400 Error");
        $response = ["success" => false, "error" => $err];
    } else {
        $response = $data;
    }
    $action->lay->noparse = true;
    $action->lay->template = json_encode($response);
}
