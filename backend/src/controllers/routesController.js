const db = require("../config/db");

const getRoutePayload = (body) => ({
  origin_id: body.origin_id,
  dest_id: body.dest_id,
  distance_km: body.distance_km ?? body.distance,
  estimated_time: body.estimated_time,
});

const verifyOriginAndDestCitiesExist = (origin_id, dest_id, res, onOk) => {
  db.query(
    "SELECT COUNT(DISTINCT city_id) AS n FROM cities WHERE city_id IN (?, ?)",
    [origin_id, dest_id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (!rows[0] || rows[0].n !== 2) {
        return res.status(400).json({
          message: "origin_id and/or dest_id must refer to existing cities",
        });
      }
      onOk();
    }
  );
};

exports.getRoutes = (req, res) => {
  db.query(
    "SELECT route_id, origin_id, dest_id, distance_km, distance_km AS distance, estimated_time FROM routes",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};

exports.getRouteById = (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT route_id, origin_id, dest_id, distance_km, distance_km AS distance, estimated_time FROM routes WHERE route_id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};

exports.addRoute = (req, res) => {
  const { origin_id, dest_id, distance_km, estimated_time } = getRoutePayload(req.body);
  if (
    origin_id == null ||
    dest_id == null ||
    distance_km == null ||
    estimated_time == null
  ) {
    return res.status(400).json({
      message:
        "origin_id, dest_id, distance, and estimated_time are required",
    });
  }
  if (Number(origin_id) === Number(dest_id)) {
    return res
      .status(400)
      .json({ message: "origin_id and dest_id must be different cities" });
  }

  verifyOriginAndDestCitiesExist(origin_id, dest_id, res, () => {
    db.query(
      "INSERT INTO routes (origin_id, dest_id, distance_km, estimated_time) VALUES (?, ?, ?, ?)",
      [origin_id, dest_id, distance_km, estimated_time],
      (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Route Created Successfully" });
      }
    );
  });
};

exports.updateRoute = (req, res) => {
  const { id } = req.params;
  const { origin_id, dest_id, distance_km, estimated_time } = getRoutePayload(req.body);

  if (
    origin_id == null ||
    dest_id == null ||
    distance_km == null ||
    estimated_time == null
  ) {
    return res.status(400).json({
      message:
        "origin_id, dest_id, distance, and estimated_time are required",
    });
  }
  if (Number(origin_id) === Number(dest_id)) {
    return res
      .status(400)
      .json({ message: "origin_id and dest_id must be different cities" });
  }

  db.query("SELECT * FROM routes WHERE route_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "Route not found" });
    }
    verifyOriginAndDestCitiesExist(origin_id, dest_id, res, () => {
      db.query(
        "UPDATE routes SET origin_id = ?, dest_id = ?, distance_km = ?, estimated_time = ? WHERE route_id = ?",
        [origin_id, dest_id, distance_km, estimated_time, id],
        (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: "Route Updated Successfully" });
        }
      );
    });
  });
};

exports.deleteRoute = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM routes WHERE route_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "Route not found" });
    }
    db.query("DELETE FROM routes WHERE route_id = ?", [id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Route Deleted Successfully" });
    });
  });
};