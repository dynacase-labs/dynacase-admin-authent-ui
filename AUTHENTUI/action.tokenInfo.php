<?php
function tokenInfo(Action & $action)
{
    $usage = new ActionUsage($action);
    //$search = $usage->addOptionalParameter("search", "search filters");
    $tokenId = $usage->addRequiredParameter("token", "token id");

    $err = "";
    $info = [];

    $expendableTrue=___("Once", "accesstoken");
    $expendableFalse=___("Multiple", "accesstoken");
    $token=new UserToken($action->dbaccess, $tokenId);
    if (! $token->isAffected()) {
        $err=sprintf("Token %s not exists", $tokenId);
    } else {
        $info=$token->getValues();
        foreach ($info as $k=>$v) {
            $info[$k]=$v;
        }

        $u=new Account($action->dbaccess, $token->userid);
        if ($u->isAffected()) {

            $info["user"]=sprintf("%s %s (%s)", $u->firstname, $u->lastname, $u->login);
        } else {
             $info["user"]=$token->userid;
        }
        $u=new Account($action->dbaccess, $token->authorid);
        if ($u->isAffected()) {
             $info["author"]= sprintf("%s %s (%s)", $u->firstname, $u->lastname, $u->login);
        } else {
             $info["author"]= $token->authorid;
        }
        if ($token->context) {
            $context=unserialize($token->context);
            $info["context"]=$context;


        }

        $info["expendable"]= ($token->expendable === "t");
        $info["title"]= ($token->description) ? $token->description : $token->token;
    }

    if ($err) {
        header("HTTP/1.0 400 Error");
        $response = ["success" => false, "error" => $err];
    } else {
        $response = ["success" => true, "data" => $info];

    }
    $action->lay->noparse = true;
    $action->lay->template = json_encode($response);

}
