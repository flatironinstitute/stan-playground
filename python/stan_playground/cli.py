import click
import stan_playground
from .init_compute_resource_node import init_compute_resource_node as init_compute_resource_node_function
from .start_compute_resource_node import start_compute_resource_node as start_compute_resource_node_function

@click.group(help="stan-playground command line interface")
def main():
    pass

@click.command(help='Initialize a compute resource node in the current directory')
@click.option('--compute-resource-id', default='', help='Compute resource ID')
@click.option('--compute-resource-private-key', default='', help='Compute resource private key')
def init_compute_resource_node(compute_resource_id: str, compute_resource_private_key: str):
    init_compute_resource_node_function(dir='.', compute_resource_id=compute_resource_id, compute_resource_private_key=compute_resource_private_key)

@click.command(help="Start the compute resource node in the current directory")
def start_compute_resource_node():
    start_compute_resource_node_function(dir='.')

@click.command(help='Initialize the singularity container')
def init_singularity_container():
    stan_playground.init_singularity_container()

@click.command(help='Initialize the docker container')
def init_docker_container():
    stan_playground.init_docker_container()

main.add_command(init_compute_resource_node)
main.add_command(start_compute_resource_node)
main.add_command(init_singularity_container)
main.add_command(init_docker_container)