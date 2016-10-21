<?php
function tokenMethod(Action & $action)
{
    $usage = new ActionUsage($action);
    //$search = $usage->addOptionalParameter("search", "search filters");
    $method = $usage->addRequiredParameter("method", "method to use", array(
        "delete","create"
    ));
    
    $usage->setStrictMode(false);
    $err = "";
    $message="";$token="";
    switch ($method) {
        case "delete":
            $token = $usage->addRequiredParameter("token", "token");
            $usage->verify();
            $userToken = new UserToken($action->dbaccess, $token);
            if ($userToken->isAffected()) {
                $err = $userToken->delete();
                $message= sprintf(___("<p>Token <b>%s</b></br> has been deleted.</p>", "access") , $token);
            } else {
                $err = sprintf(___("Token %s not exists", "access") , $token);
            }

            break;
    case "create":
        $userLogin = $usage->addRequiredParameter("user", "User login");
        $expandable = $usage->addRequiredParameter("expandable", "expandable", array("one","always"));
        $contextAction = $usage->addOptionalParameter("openaction", "Selected action");
        $expireDate = $usage->addOptionalParameter("expiredate", "Selected action");
        $expireTime = $usage->addOptionalParameter("expiretime", "Selected action");
        $description = $usage->addOptionalParameter("description", "Text description");
        $expireInfinity = $usage->addOptionalParameter("expireinfinite", "Infinity",null, array("true","false"));
        $getKeys = $usage->addOptionalParameter("getkey", "Extra context key",function ($v,$n,$usage) {
            return ApiUsage::isArray($v,$n,$usage);
        },[]);
        $getValues = $usage->addOptionalParameter("getvalue", "Extra context value",function ($v,$n,$usage) {
            return ApiUsage::isArray($v,$n,$usage);
        },[]);
        $usage->verify();
        $user=new Account($action->dbaccess);
        $user->setLoginName($userLogin);
        if (!$user->isAffected() || $user->accounttype !== "U") {
            $err = sprintf(___("User %s not exists", "access") , $userLogin);
        } else {

            $userToken = new UserToken($action->dbaccess);
            $userToken->userid=$user->id;
            $userToken->token=$userToken->genToken();
            if ($expireInfinity === "true") {
                $userToken->expire = "infinity";
            } else {

                $userToken->expire=sprintf("%sT%s", $expireDate,$expireTime );
                if (!token_validateDate($userToken->expire)) {
                    $err=sprintf(___("Invalid date \"%s\" for token", "accessToken"), $userToken->expire);
                }
            }
            if (!$err) {
                $userToken->expendable = ($expandable === "one");

                $userToken->description=$description;

                $context = [];
                if ($contextAction) {
                    list($appName, $actionName) = explode(":", $contextAction);
                    $context["app"] = $appName;
                    $context["action"] = $actionName;
                }
                foreach ($getKeys as $k => $key) {
                    if (!empty($getValues[$k])) {
                        $context[$key] = $getValues[$k];
                    }
                }
                $userToken->context = $context;
                $err = $userToken->add();
                $message = sprintf(
                    ___(
                        "<p>Token <b>%s</b></br> has been create.</p>", "access"
                    ), $userToken->token
                );
                $token = $userToken->token;
            }
        }


        break;
    }



    header('Content-Type: application/json');
    
    if ($err) {
        header("HTTP/1.0 400 Error");
        $response = ["success" => false, "error" => $err];
    } else {
        $response = ["success" => true, "token" => $token, "message" => $message];
    }
    $action->lay->noparse = true;
    $action->lay->template = json_encode($response);
}

function token_validateDate($date)
{
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/', $date, $parts) > 0) {
        $time = mktime($parts[4], $parts[5], 0, $parts[2], $parts[3], $parts[1]);

        $input_time = strtotime($date);
        if ($input_time === false) return false;


        return $input_time == $time;
    } else {
        return false;
    }
}