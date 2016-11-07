<?php
namespace Dcp\Authent;

class tokenData
{
    
    protected $start = 0;
    protected $length = 10;
    protected $columns = [];
    protected $showExpired = true;
    /**
     * @var \QueryDb
     */
    protected $q;
    protected $filterType;
    
    public function __construct()
    {
        $this->expendableTrue = ___("Once", "accesstoken");
        $this->expendableFalse = ___("Multiple", "accesstoken");
        $this->q = new \QueryDb("", "UserToken");
    }
    /**
     * @param int $start
     */
    public function setStart($start)
    {
        $this->start = $start;
    }
    /**
     * @param int $length
     */
    public function setLength($length)
    {
        $this->length = $length;
    }
    /**
     * @param array $columns
     */
    public function setColumns($columns)
    {
        $this->columns = $columns;
    }
    /**
     * @param boolean $showExpired
     */
    public function setShowExpired($showExpired)
    {
        $this->showExpired = $showExpired;
    }
    
    public function setFilterType($filterType)
    {
        $this->filterType = $filterType;
    }
    
    public function getRawData()
    {
        
        if (!$this->showExpired) {
            $this->q->addQuery("expire > now()");
        }
        if ($this->filterType) {
            $this->q->addQuery(sprintf("type = '%s'", pg_escape_string($this->filterType)));
        } else {
            $this->q->addQuery("(type is null or type = 'CORE')");
        }
        
        $this->q->order_by = "cdate desc nulls last, expire, userid, token";
        foreach ($this->columns as $col) {
            $colName = $col["data"];
            if ($col["searchable"] === "true") {
                $col["search"]["value"] = trim($col["search"]["value"]);
                if (!empty($col["search"]["value"])) {
                    if ($colName === "user") {
                        $sValue = pg_escape_string($col["search"]["value"]);
                        simpleQuery("", sprintf("select id from users where coalesce(firstname,'') || ' ' || lastname  || '(' || login || ')' ~* '%s'", $sValue) 
                        , $userIds, true, false);
                        if ($userIds) {
                            $this->q->addQuery(sprintf("userid in (%s)", implode(",", $userIds)));
                        } else {
                            $this->q->addQuery("false");
                        }
                    } else if ($colName === "expendable") {
                        if (strtolower($col["search"]["value"][0]) === strtolower($this->expendableTrue[0])) {
                            $this->q->addQuery(sprintf("%s", $colName));
                        } elseif (strtolower($col["search"]["value"][0]) === strtolower($this->expendableFalse[0])) {
                            $this->q->addQuery(sprintf("(not %s or %s is null)", $colName, $colName));
                        }
                    } else {
                        $this->q->addQuery(sprintf("%s::text ~ '%s'", $colName, pg_escape_string($col["search"]["value"])));
                    }
                }
            }
        }
        
        $tokenData = $this->q->Query($this->start, $this->length, "TABLE");
        if ($this->q->nb === 0) {
            $tokenData = [];
        }
        return $tokenData;
    }
    
    public function getDisplayData($rawData)
    {
        $userids = [];
        $displayData = [];
        if (count($rawData) > 0) {
            foreach ($rawData as $tokenRow) {
                $userids[] = intval($tokenRow["userid"]);
                $context = unserialize($tokenRow["context"]);
                if (is_array($context)) {
                    $tContext = [];
                    ksort($context);
                    foreach ($context as $k => $v) {
                        if (is_array($v)) {
                            $vs = [];
                            foreach ($v as $kk => $vv) {
                                if (is_array($vv)) {
                                    $vv = implode(",", $vv);
                                }
                                $vs[] = sprintf("%s : %s", $kk, print_r($vv, true));
                            }
                            $v = implode(", ", $vs);
                        }
                        $tContext[] = sprintf("<span><b>%s</b>&nbsp;:&nbsp;<i>%s</i></span>", $k, print_r($v, true));
                    }
                    $scontext = implode(", ", $tContext);
                } else {
                    $scontext = $tokenRow["context"];
                }
                
                $displayData[] = ["token" => $tokenRow["token"], "description" => $tokenRow["description"], "userid" => $tokenRow["userid"], "expire" => $tokenRow["expire"], "context" => $scontext, "expendable" => ($tokenRow["expendable"]) ? $this->expendableTrue : $this->expendableFalse, "button" => "<a/>"];
            }
            
            simpleQuery("", sprintf("select id, login, firstname, lastname from users where id in (%s)", implode(",", array_unique($userids))) , $usersData);
            $userLogin = [];
            foreach ($usersData as $userRow) {
                $userLogin[$userRow["id"]] = htmlspecialchars(sprintf("%s %s (%s)", $userRow["firstname"], $userRow["lastname"], $userRow["login"]));
            }
            $now = date("Y-m-d H:i:s");
            foreach ($displayData as & $row) {
                $row["user"] = empty($userLogin[$row["userid"]]) ? "INVALID " . $row["userid"] : $userLogin[$row["userid"]];
                $row["hasExpired"] = ($row["expire"] < $now);
            }
        }
        return $displayData;
    }
    /**
     * @return int
     */
    public function getTotalCount()
    {
        $this->q->Query(0, 0, "TABLE");
        return $this->q->nb;
    }
    
    public function getTotalExpire()
    {
        if ($this->filterType) {
            $filter = sprintf("type = '%s'", pg_escape_string($this->filterType));
        } else {
            $filter = "(type is null or type = 'CORE')";
        }
        
        simpleQuery("", "select count(*) from usertoken where expire < now() and $filter", $totalExpire, true, true);
        return $totalExpire;
    }
    
    public function getShowTotal()
    {
        if ($this->filterType) {
            $filter = sprintf("type = '%s'", pg_escape_string($this->filterType));
        } else {
            $filter = "(type is null or type = 'CORE')";
        }
        
        if ($this->showExpired) {
            simpleQuery("", "select count(*) from usertoken where $filter", $total, true, true);
        } else {
            simpleQuery("", "select count(*) from usertoken where expire > now() and $filter", $total, true, true);
        }
        return $total;
    }
}
