from django.db import models
from django.conf import settings

class PongGame(models.Model):
	GAME_TYPE_CHOICES = [
        ('local', 'Local Game'),
        ('online', 'Online Game'),
	]
	player_left = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='games_left', on_delete=models.SET_NULL, null=True)
	player_right = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='games_right', on_delete=models.SET_NULL, null=True)
	ball_x = models.FloatField(default=400)
	ball_y = models.FloatField(default=300)
	ball_speed_x = models.FloatField(default=0.8)
	ball_speed_y = models.FloatField(default=0.8)
	left_paddle_y = models.IntegerField(default=250)
	right_paddle_y = models.IntegerField(default=250)
	left_score = models.IntegerField(default=0)
	right_score = models.IntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)
	is_active = models.BooleanField(default=False)
	right_actif = models.BooleanField(default=False)
	left_actif = models.BooleanField(default=False)
	is_online = models.BooleanField(default=False)
	game_type = models.CharField(max_length=10, choices=GAME_TYPE_CHOICES, default='local')


	CANVAS_WIDTH = 800
	CANVAS_HEIGHT = 600
	PADDLE_WIDTH = 10
	PADDLE_HEIGHT = 100
	BALL_SIZE = 10
	BASE_SPEED = 300

	def update_position(self, delta_time):
        # Mise à jour de la position de la balle
		self.ball_x += self.ball_speed_x * self.BASE_SPEED * delta_time
		self.ball_y += self.ball_speed_y * self.BASE_SPEED * delta_time

        # Rebonds sur les murs horizontaux
		if self.ball_y <= self.BALL_SIZE or self.ball_y >= self.CANVAS_HEIGHT - self.BALL_SIZE:
			self.ball_speed_y *= -1
			self.ball_y = max(self.BALL_SIZE, min(self.ball_y, self.CANVAS_HEIGHT - self.BALL_SIZE))

        # Rebonds sur les raquettes
		if (self.ball_x <= 30 + self.BALL_SIZE and 
			self.left_paddle_y <= self.ball_y <= self.left_paddle_y + self.PADDLE_HEIGHT):
			self.ball_speed_x = abs(self.ball_speed_x)
            # Ajouter un peu de variation à l'angle de rebond
			paddle_center = self.left_paddle_y + self.PADDLE_HEIGHT / 2
			relative_intersect_y = (self.ball_y - paddle_center) / (self.PADDLE_HEIGHT / 2)
			self.ball_speed_y += relative_intersect_y * 0.5
			self.ball_speed_x *= 1.1
			self.ball_speed_y *= 1.1
            
		elif (self.ball_x >= self.CANVAS_WIDTH - 30 - self.BALL_SIZE and 
				self.right_paddle_y <= self.ball_y <= self.right_paddle_y + self.PADDLE_HEIGHT):
			self.ball_speed_x = -abs(self.ball_speed_x)
            # Même variation pour la raquette droite
			paddle_center = self.right_paddle_y + self.PADDLE_HEIGHT / 2
			relative_intersect_y = (self.ball_y - paddle_center) / (self.PADDLE_HEIGHT / 2)
			self.ball_speed_y += relative_intersect_y * 0.5
			self.ball_speed_x *= 1.5
			self.ball_speed_y *= 1.5

        # Normaliser la vitesse verticale
		max_speed = 3
		self.ball_speed_y = max(min(self.ball_speed_y, max_speed), -max_speed)
		self.ball_speed_x = max(min(self.ball_speed_x, max_speed), -max_speed)
        # Points
		if self.ball_x <= 0:
			self.right_score += 1
			self.reset_ball()
		elif self.ball_x >= self.CANVAS_WIDTH:
			self.left_score += 1
			self.reset_ball()

	def reset_ball(self):
		self.ball_x = self.CANVAS_WIDTH / 2
		self.ball_y = self.CANVAS_HEIGHT / 2
        # Inverser la direction et réinitialiser la vitesse
		self.ball_speed_x = -self.ball_speed_x if self.ball_speed_x > 0 else self.ball_speed_x
		self.ball_speed_y = 0.5 if self.ball_speed_y > 0 else -0.5
        # Normaliser la vitesse
		self.ball_speed_x = 1.0 if self.ball_speed_x > 0 else -1.0