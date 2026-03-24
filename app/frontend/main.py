"""Flet entry point for MyBento frontend."""

import flet as ft


def main(page: ft.Page) -> None:
    """Initialize the MyBento application window."""
    page.title = "MyBento"
    page.window_width = 1200
    page.window_height = 800
    page.window_min_width = 800
    page.window_min_height = 600
    page.theme_mode = ft.ThemeMode.LIGHT

    page.add(
        ft.Column(
            controls=[
                ft.Text(
                    "MyBento",
                    size=32,
                    weight=ft.FontWeight.BOLD,
                ),
                ft.Text(
                    "Gestión de recetas y menús semanales",
                    size=16,
                    color=ft.Colors.GREY_600,
                ),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            expand=True,
        )
    )


if __name__ == "__main__":
    ft.app(target=main)
