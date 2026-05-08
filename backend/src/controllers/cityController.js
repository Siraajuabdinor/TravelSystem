const db = require("../config/db");

exports.getCities = (req, res) => {
  db.query("SELECT * FROM cities", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.getCityById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM cities WHERE city_id=?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.addCity = (req, res) => {
  const { city_name } = req.body;
  if (!city_name) {
    return res.status(400).json({ message: "City name is required" });
  }
  // Check if city already exists
  db.query("SELECT * FROM cities WHERE city_name=?", [city_name], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length > 0) {
      return res.status(400).json({ message: "City already exists" });
    }
  db.query(
    "INSERT INTO cities (city_name) VALUES (?)",
    [city_name],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "City Created Successfully" });
    }
  );
});};

exports.updateCity = (req, res) => {
  const { id } = req.params;
  const { city_name } = req.body;
  // Check if city exists
  db.query("SELECT * FROM cities WHERE city_id=?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "City not found" });
    }
    db.query(
      "UPDATE cities SET city_name=? WHERE city_id=?",
      [city_name, id],
      (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "City Updated Successfully" });
      }
    );
  });
};

exports.deleteCity = (req, res) => {
  const { id } = req.params;
  // Check if city exists
  db.query("SELECT * FROM cities WHERE city_id=?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "City not found" });
    }
    db.query("DELETE FROM cities WHERE city_id=?", [id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "City Deleted Successfully" });
    });
  });
};

//delete all cities
exports.deleteAllCities = (req, res) => {
  db.query("DELETE FROM cities", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "All Cities Deleted Successfully" });
  });
};