package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"log/syslog"
	"net"
	"net/http"
	"os"
	"strconv"
)

func getEnv(key string, defa string) string {
	value, isSet := os.LookupEnv(key)
	if isSet {
		return value
	} else {
		return defa
	}
}

type Config struct {
	MetricsNet  string
	MetricsAddr string
	SyslogNet   string
	SyslogAddr  string
	SyslogTag   string
	CORSOrigin  string
	MaxPostSize int
}

var conf Config

func readEnvConfig() {
	// 3 (tech IDs, item IDs, ignored IDs) x 14 (len('"XY1234.567", ')) x 1000 + 500 (extra) = 42500
	max_post_str := getEnv("MAX_POST_SIZE", "42500")
	max_post_int, err := strconv.Atoi(max_post_str)

	if err != nil {
		log.Printf("The provided MAX_POST_SIZE '%s' is not an int\n", max_post_str)
		log.Fatalln(err)
	}

	conf = Config{
		MetricsNet:  getEnv("METRICS_NETWORK", "tcp"),
		MetricsAddr: getEnv("METRICS_ADDRESS", ":8000"),
		SyslogNet:   getEnv("SYSLOG_NETWORK", "udp"),
		SyslogAddr:  getEnv("SYSLOG_ADDRESS", "127.0.0.1:514"),
		SyslogTag:   getEnv("SYSLOG_TAG", "playbookngexport:"),
		CORSOrigin:  getEnv("CORS_ORIGIN", "*"),
		MaxPostSize: max_post_int,
	}
}

type MetricData struct {
	TechIDs        []string `json:"techIDs"`
	ItemIDs        []string `json:"itemIDs"`
	IgnoredItemIDs []string `json:"ignoredItemIDs"`
	Format         string   `json:"format"`
}

func isMetricDataValid(data []byte) bool {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()

	var metric MetricData
	err := decoder.Decode(&metric)

	return (err == nil)
}

const PostBodyToken string = "POSTBODY"

func handler(w http.ResponseWriter, req *http.Request) {

	// access: allow POST, cache 10min
	w.Header().Set("Access-Control-Allow-Origin", conf.CORSOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "POST")
	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("Access-Control-Max-Age", "600")

	if req.Method == "OPTIONS" {
		// OPTIONS: pre-flight check
		w.WriteHeader(http.StatusNoContent)

	} else if req.Method == "POST" {
		// POST: main functionality
		body, err := io.ReadAll(req.Body)
		body_len := len(body)
		if (err == nil) && (body_len > 0) && (body_len < conf.MaxPostSize) && isMetricDataValid(body) {
			// body content: log it
			log.Printf("%s %s\n", PostBodyToken, string(body))
			w.WriteHeader(http.StatusNoContent)
		} else {
			// error/empty/too big: fail
			w.WriteHeader(http.StatusBadRequest)
		}
	} else {
		// OTHER: fail
		w.WriteHeader(http.StatusBadRequest)
	}
}

func prettyLogEnvConfig() {
	log.Printf(
		"Will accept POSTs on '%s' over '%s' from origin '%s' with a max length of %d bytes\n",
		conf.MetricsAddr,
		conf.MetricsNet,
		conf.CORSOrigin,
		conf.MaxPostSize,
	)

	if len(conf.SyslogNet) == 0 {
		log.Printf("Will connect to local syslog\n")
	} else {
		log.Printf("Will connect to remote syslog at '%s' over '%s'\n", conf.SyslogAddr, conf.SyslogNet)
	}

	if len(conf.SyslogTag) == 0 {
		log.Printf("Will syslog with tag '%s'\n", os.Args[0])
	} else {
		log.Printf("Will syslog with tag '%s'\n", conf.SyslogTag)
	}

	log.Printf("Logged POSTs will include the token '%s'\n", PostBodyToken)
}

func connectToSyslog() *syslog.Writer {
	s, err := syslog.Dial(conf.SyslogNet, conf.SyslogAddr, syslog.LOG_INFO, conf.SyslogTag)
	if err != nil {
		log.Printf("Failed to connect to syslog with Dial() https://pkg.go.dev/log/syslog#Dial\n")
		log.Fatalln(err)
	}
	return s
}

func openListener() net.Listener {
	l, err := net.Listen(conf.MetricsNet, conf.MetricsAddr)
	if err == nil {
		log.Printf("Now listening on '%s'\n", conf.MetricsAddr)
	} else {
		log.Printf("Failed to listen on '%s'\n", conf.MetricsAddr)
		log.Fatalln(err)
	}
	return l
}

func main() {
	// log -> console
	log.SetOutput(os.Stdout)
	log.Printf("Starting\n")

	readEnvConfig()
	prettyLogEnvConfig()

	// connect syslog + add to logging
	s := connectToSyslog()
	defer s.Close()
	log.SetOutput(io.MultiWriter(os.Stdout, s))
	log.Printf("Syslog connected\n")

	l := openListener()
	defer l.Close()

	// serve on listener
	h := http.HandlerFunc(handler)
	log.Printf("Now serving on '%s'\n", conf.MetricsAddr)
	log.Fatalln(http.Serve(l, h))
}
