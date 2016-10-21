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
        $action->exitError(sprintf("Token %s not exists", $tokenId));
    } else {
        $info=$token->getValues();
        foreach ($info as $k=>$v) {
            $action->lay->eset($k, $v);
        }

        $u=new Account($action->dbaccess, $token->userid);
        if ($u->isAffected()) {
            $action->lay->set("user", sprintf("%s %s (%s)", $u->firstname, $u->lastname, $u->login));
        } else {
            $action->lay->set("user", $token->userid);
        }
        $u=new Account($action->dbaccess, $token->authorid);
        if ($u->isAffected()) {
            $action->lay->set("author", sprintf("%s %s (%s)", $u->firstname, $u->lastname, $u->login));
        } else {
            $action->lay->set("author", $token->authorid);
        }
        if ($token->context) {
            $context=unserialize($token->context);
            if (is_array($context)) {
                $tContext = [];
                ksort($context);
                foreach ($context as $k => $v) {
                    $tContext[] = sprintf("<li><b>%s</b>&nbsp;:&nbsp;<i>%s</i></li>", $k, $v);
                }
                $scontext = "<ul>".implode(" ", $tContext)."</ul>";
                $action->lay->set("context", $scontext);

            }

        }
        $action->lay->set("expendable", ($token->expendable) ? $expendableTrue : $expendableFalse);
    }

    

}
