const db = require("../config/db");

exports.getVehicles = (req, res) => {
  db.query("SELECT * FROM vehicles", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.getVehicleById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM vehicles WHERE vehicle_id=?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.addVehicle = (req, res) => {
  const { vehicle_type, plate_number } = req.body;
  if (!vehicle_type || !plate_number) {
    return res.status(400).json({ message: "Vehicle type and plate number are required" });
  }
  // Check if vehicle already exists
  db.query("SELECT * FROM vehicles WHERE plate_number=?", [plate_number], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length > 0) {
      return res.status(400).json({ message: "Vehicle with this plate number already exists" });
    }
  db.query(
    "INSERT INTO vehicles (vehicle_type, plate_number) VALUES (?, ?)",
    [vehicle_type, plate_number],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Vehicle Created Successfully" });
    }
  );
});};

exports.updateVehicle = (req, res) => {
  const { id } = req.params;
  const { vehicle_type, plate_number } = req.body;
  // Check if vehicle exists
  db.query("SELECT * FROM vehicles WHERE vehicle_id=?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    db.query(
      "UPDATE vehicles SET vehicle_type=?, plate_number=? WHERE vehicle_id=?",
      [vehicle_type, plate_number, id],
      (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Vehicle Updated Successfully" });
      }
    );
  });
};

exports.deleteVehicle = (req, res) => {
  const { id } = req.params;
  // Check if vehicle exists
  db.query("SELECT * FROM vehicles WHERE vehicle_id=?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    db.query("DELETE FROM vehicles WHERE vehicle_id=?", [id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Vehicle Deleted Successfully" });
    });
  });
};
