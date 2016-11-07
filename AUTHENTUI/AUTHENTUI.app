<?php

$app_desc = array(
    "name" => "AUTHENTUI",
    "short_name" => N_("AUTHENTUI:AUTHENTUI"),
    "description" => N_("AUTHENTUI:AUTHENTUIDESCR"),
    "icon" => "AUTHENTUI.png",
    "with_frame" =>"Y",
    "displayable" => "N",
    "tag" => "ADMIN SYSTEM AUTHENT",
    "childof" => ""
);


$app_acl = array(
    array(
        "name"          => "ADMIN",
        "description"   => N_("AUTHENTUI:main Access"),
        "admin"         => true
    )
);


// Actions for this application
$action_desc = array(
    array(
        "name"       => "ADMIN_ACTIONS_LIST",
        "short_name" => N_("AUTHENTUI:ADMIN_ACTIONS_LIST short_name"),
        "script" => "action.actionlist.php",
        "function" => "actionlist",
        "acl" => "ADMIN"
    ),
    array(
        "name" => "TOKEN_ACCESS",

        "toc_order" => 1,
        "toc" => "Y",
        "acl" => "ADMIN",
        "short_name" => N_("Token Access"),
        "script" => "action.tokenAccess.php",
        "function" => "tokenAccess",
        "layout" => "token_access.html"
    ),
    array(
        "name" => "TOKEN_DATA",
        "acl" => "ADMIN",
        "script" => "action.tokenData.php",
        "function" => "tokenData",
        "short_name" => N_("Token Data")
    ),
    array(
        "name" => "TOKEN_INFO",
        "acl" => "ADMIN",
        "script" => "action.tokenInfo.php",
        "function" => "tokenInfo",
        "short_name" => N_("Token Info"),
        "layout" => "token_info.html"
    ),
    array(
        "name" => "TOKEN_USERDATA",
        "acl" => "ADMIN",
        "script" => "action.tokenUserData.php",
        "function" => "tokenUserData",
        "short_name" => N_("Token User Data")
    ),
    array(
        "name" => "TOKEN_METHOD",
        "acl" => "ADMIN",
        "script" => "action.tokenMethod.php",
        "function" => "tokenMethod",
        "short_name" => N_("Token Methods")
    )
);

