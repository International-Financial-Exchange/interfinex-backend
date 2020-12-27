const conf = {
    _id: "initialReplSet",
    members: [
        { _id: 0, host: "localhost:27017" }
    ]
}

rs.initiate(conf);