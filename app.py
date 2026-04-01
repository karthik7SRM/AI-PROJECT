from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/validate', methods=['POST'])
def validate():
    data = request.json
    board = data['board']
    start = data['start'] # [row, col]
    end = data['end']     # [row, col]
    turn = data['turn']   # 1 for Red, 2 for Black

    piece = board[start[0]][start[1]]
    
    # basic check: is it the right turn?
    if (turn == 1 and piece not in [1, 3]) or (turn == 2 and piece not in [2, 4]):
        return jsonify({"valid": False, "msg": "Not your piece!"})

    r_diff = end[0] - start[0]
    c_diff = abs(end[1] - start[1])

    # Movement direction (Red moves -1, Black moves +1)
    # Kings (3 and 4) can move any direction
    is_king = piece in [3, 4]
    direction = -1 if piece == 1 else 1

    # 1. Simple Move
    if c_diff == 1 and (r_diff == direction or is_king):
        if board[end[0]][end[1]] == 0:
            return jsonify({"valid": True, "type": "move"})

    # 2. Jump (Capture)
    if c_diff == 2 and (abs(r_diff) == 2):
        # Even non-kings can jump backwards if we follow standard rules, 
        # but let's stick to direction for simple pieces:
        if not is_king and (r_diff != 2 * direction):
             return jsonify({"valid": False, "msg": "Normal pieces move forward!"})
             
        mid_r = (start[0] + end[0]) // 2
        mid_c = (start[1] + end[1]) // 2
        mid_piece = board[mid_r][mid_c]

        # Must jump over an enemy
        if mid_piece != 0 and mid_piece != piece and mid_piece != (piece + 2 if piece < 3 else piece):
            return jsonify({"valid": True, "type": "jump", "remove": [mid_r, mid_c]})

    return jsonify({"valid": False, "msg": "Illegal move!"})

if __name__ == '__main__':
    app.run(port=5000, debug=True)